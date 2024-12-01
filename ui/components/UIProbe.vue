<template>
    <div class="probe-container">
        <div class="probe-chart">
            <canvas ref="chart" class="probe-chart-canvas" />
        </div>
        <div class="probe-label">
            <div class="probe-name">{{ props.label }}</div>
            <div
                class="probe-value"
                :style="[ displayValue == 'ERR' ? { color: 'red' } : {} ]"
            >
                {{ displayValue }}
            </div>
        </div>
    </div>
</template>

<script>
import { Chart } from 'chart.js/auto'
import 'chartjs-adapter-luxon'
import { shallowRef } from 'vue'
import { mapState } from 'vuex'

export default {
    name: 'UIProbe',
    inject: ['$socket', '$dataTracker'],
    props: {
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({ enabled: false, visible: false }) }
    },
    data () {
        return {
            /** @type {Chart} */
            chart: null,
            chartUpdateDebounceTimeout: null,
            value: 0,
            min: 0,
            max: 0
        }
    },
    computed: {
        ...mapState('data', ['messages']),
        displayValue: function () {
            if (this.value === 'ERR') {
                return this.value
            }
            return this.props.symbol !== '' ? this.value + this.props.symbol : this.value
        }
    },
    created () {
        this.$dataTracker(this.id, this.onInput, this.onLoad)
    },
    mounted () {
        const el = this.$refs.chart
        const config = {
            type: 'line',
            data: {
                datasets: [
                    {
                        data: [],
                        borderWidth: 2,
                        fill: false,
                        tension: 0.2,
                        pointStyle: 'circle',
                        pointRadius: 0,
                        pointHoverRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0,
                    easing: 'linear'
                },
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        displayColors: false
                    }
                },
                interaction: {
                    intersect: false,
                    axis: 'x',
                    mode: 'nearest'
                },
                scales: {
                    x: {
                        display: false,
                        type: 'timeseries',
                        time: {
                            tooltipFormat: 'HH:mm'
                        }
                    },
                    y: {
                        display: true,
                        ticks: {
                            suggestedMin: 0,
                            suggestedMax: 0,
                            callback: (val, index, values) => {
                                if (index === values.length - 1) {
                                    return this.max
                                } else if (index === 0) {
                                    return this.min
                                } else {
                                    return ''
                                }
                            },
                            padding: 0,
                            autoSkip: false,
                            mirror: true
                        },
                        grid: {
                            drawTicks: false,
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 5,
                        right: 5
                    }
                }
            }
        }
        const chart = new Chart(el, config)
        this.chart = shallowRef(chart)
    },
    methods: {
        update (immediate = true) {
            if (immediate) {
                if (this.chartUpdateDebounceTimeout) {
                    clearTimeout(this.chartUpdateDebounceTimeout)
                    this.chartUpdateDebounceTimeout = null
                }
                this.chart.update()
                return
            }
            if (this.chartUpdateDebounceTimeout) {
                return
            }
            this.chartUpdateDebounceTimeout = setTimeout(() => {
                try {
                    this.chart.update()
                } finally {
                    this.chartUpdateDebounceTimeout = null
                }
            }, 30)
        },
        onLoad (history) {
            if (history && history.length > 0) {
                this.clear()
                this.onInput(history)
            }
        },
        onInput (msg) {
            if (Array.isArray(msg.payload) && !msg.payload.length) {
                this.clear()
            } else {
                if (Array.isArray(msg) && msg.length > 0) {
                    msg.forEach((m) => {
                        const d = m._datapoint
                        this.addPoints(d)
                    })
                } else if (Array.isArray(msg._datapoint) && msg._datapoint.length > 0) {
                    msg._datapoint.forEach((d, i) => {
                        this.addPoints(d)
                    })
                } else if (msg._datapoint !== null && msg._datapoint !== undefined) {
                    this.addPoints(msg._datapoint)
                } else {
                    // no payload
                }
                this.limitDataSize()
                this.updateValues()
                this.update()
            }
        },
        clear () {
            this.chart.data.datasets[0].data = []
            this.updateValues()
            this.update()
        },
        addPoints (d) {
            this.addToChart(d)
            this.$store.commit('data/append', {
                widgetId: this.id,
                msg: {
                    _datapoint: d
                }
            })
        },
        addToChart (d) {
            this.chart.data.datasets[0].data.push(d)
            // for (let i = 0; i < this.chart.data.datasets[0].data.length; i++) {
            //     if (typeof this.chart.data.datasets[0].data[i] === 'undefined') {
            //         this.chart.data.datasets[0].data[i] = {}
            //     }
            // }
        },
        limitDataSize () {
            let cutoff = null
            if (this.props.removeOlder && this.props.removeOlderUnit) {
                const removeOlder = parseFloat(this.props.removeOlder)
                const removeOlderUnit = parseFloat(this.props.removeOlderUnit)
                const ago = (removeOlder * removeOlderUnit) * 1000
                cutoff = (new Date()).getTime() - ago
            }
            if (this.chart.data.datasets[0].data.length > 0) {
                this.chart.data.datasets[0].data = this.chart.data.datasets[0].data.filter((d, i) => {
                    if (cutoff && d.x < cutoff) {
                        return false
                    }
                    return true
                })
            }
            this.$store.commit('data/restrict', {
                widgetId: this.id,
                min: cutoff
            })
        },
        updateValues () {
            let minY = Infinity
            let maxY = -Infinity
            let maxX = -Infinity
            let latest = -Infinity
            this.chart.data.datasets[0].data.forEach((m) => {
                const { x, y } = m
                if (y <= minY) minY = y
                if (y >= maxY) maxY = y
                if (x >= maxX) maxX = x; latest = y
            })
            this.chart.options.scales.y.suggestedMin = minY
            this.chart.options.scales.y.suggestedMax = maxY
            this.value = latest === -Infinity ? 0 : latest
            this.min = minY === Infinity ? 0 : minY
            this.max = maxY === -Infinity ? 0 : maxY
        }
    }
}
</script>

<style scoped>
    @import "../stylesheets/ui-probe.css";
</style>
