<template>
    <div class="ui-feed-container">
        <div class="ui-feed-header">{{ props.label }}</div>
        <div class="ui-feed-body">
            <button
                v-for="option in options" :key="option.index" :value="option.value"
                :class="[option.index == selectedIndex ? 'ui-feed-active' : buttonClass, 'ui-feed-button']"
                :style="{ 'background-color': [props.useThemeColors ? 'rgb(var(--v-theme-primary), 0.5)' : option.color] }"
            >
                <div class="ui-feed-label" @click="onChange(option)">{{ option.label }}</div>
                <div class="ui-feed-timer">{{ countdown }}</div>
                <div class="ui-feed-cancel mdi mdi-close" @click="onChange(null)" />
            </button>
        </div>
    </div>
</template>
<script>
import moment from 'moment'
import { mapState } from 'vuex'
export default {
    name: 'UIFeed',
    inject: ['$socket', '$dataTracker'],
    props: {
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) }
    },
    data () {
        return {
            buttonWidth: `${(100 / this.props.options.length)}%`,
            selection: null,
            options: this.props.options,
            tik: 0,
            seconds: 0,
            timeouts: {
                close: null,
                step: null
            }
        }
    },
    computed: {
        ...mapState('data', ['messages']),
        buttonClass: function () {
            return this.selection === null ? '' : 'ui-feed-inactive'
        },
        selectedIndex: function () {
            return this.selection?.index
        },
        countdown: function () {
            return moment.utc(this.seconds * 1000).format('HH:mm:ss')
        }
    },
    created () {
        this.$dataTracker(this.id, this.onInput, this.onLoad)
    },
    beforeUnmount () {
        clearTimeout(this.timeouts.close)
        clearInterval(this.timeouts.step)
    },
    methods: {
        onLoad (msg) {
            if (msg) {
                this.$store.commit('data/bind', {
                    widgetId: this.id,
                    msg
                })
                if (msg.payload) {
                    this.selection = msg.payload
                }
                if (msg.timer) {
                    this.startTimer(msg.timer)
                }
            }
        },
        onChange (value) {
            this.selection = value
            if (value === null) {
                this.stopTimer()
            } else {
                const dur = (value.hour * 3600) + (value.minute * 60) + value.second
                this.startTimer(dur)
            }
            this.$socket.emit('widget-change', this.id, value)
        },
        startTimer (val) {
            this.seconds = val
            this.tik = (new Date()).getTime()
            this.timeouts.close = setTimeout(() => {
                this.stopTimer()
            }, val * 1000)
            this.timeouts.step = setInterval(() => {
                const tok = (new Date()).getTime()
                const elapsed = (tok - this.tik) / 1000
                this.seconds = val - elapsed
            }, 1000)
        },
        stopTimer () {
            clearTimeout(this.timeouts.close)
            clearInterval(this.timeouts.step)
            this.tik = null
            this.timeouts.close = null
            this.timeouts.step = null
            this.selection = null
        }
    }
}
</script>
<style scoped>
@import "../stylesheets/ui-feed.css";
.ui-feed-button {
    width: v-bind(buttonWidth);
}
</style>
