<template>
    <div class="ui-input-container">
        <div class="ui-input-header">
            <div class="ui-input-label">{{ props.label }}</div>
            <div
                class="ui-input-display"
                :style="[ toDisplay == 'ERR' ? { color: 'red' } : {} ]"
            >
                {{ toDisplay }}
            </div>
        </div>
        <div class="ui-input-wrapper ui-input-round">
            <div class="ui-input-slider-wrapper">
                <div class="ui-input-slider ui-input-round" />
            </div>
            <div class="ui-input-body">
                <div v-for="option in options" :key="option.index" :value="option.value" :class="[option.index == selectedIndex ? 'ui-input-active' : '', 'ui-input-button']">
                    {{ option.label }}
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
    name: 'UIInput',
    inject: ['$socket', '$dataTracker'],
    props: {
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) }
    },
    data () {
        return {
            sliderWidth: `${(100 / this.props.options.length)}%`,
            selection: null,
            options: this.props.options,
            display: ''
        }
    },
    computed: {
        ...mapState('data', ['messages']),
        sliderLeft () {
            return `${((100 / this.props.options.length) * this.findOptionByValue(this.selection)?.index)}%`
        },
        selectedColor: function () {
            return this.props.useThemeColors ? 'rgb(var(--v-theme-primary))' : this.findOptionByValue(this.selection)?.color
        },
        selectedIndex: function () {
            return this.findOptionByValue(this.selection)?.index
        },
        toDisplay: function () {
            return this.display
        }
    },
    created () {
        this.$dataTracker(this.id, this.onInput, this.onLoad)
    },
    methods: {
        onInput (msg) {
            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg
            })
            const p = msg[this.props.stateField]
            if (typeof p !== 'undefined') {
                if (this.findOptionByValue(p) !== null) {
                    this.selection = p
                    this.display = ''
                } else {
                    this.display = 'ERR'
                }
            }
        },
        onLoad (msg) {
            if (msg) {
                this.$store.commit('data/bind', {
                    widgetId: this.id,
                    msg
                })
                const p = msg[this.props.stateField]
                if (typeof p !== 'undefined') {
                    if (this.findOptionByValue(p) !== null) {
                        this.selection = p
                        this.display = ''
                    } else {
                        this.display = 'ERR'
                    }
                }
            }
        },
        findOptionByValue: function (val) {
            const opt = this.options?.find(option => {
                if (typeof (val) === 'object') {
                    return (JSON.stringify(val) === JSON.stringify(option.value))
                } else {
                    return option.value === val
                }
            })
            if (opt) {
                return opt
            }
            return null
        }
    }
}
</script>
<style scoped>
    @import "../stylesheets/ui-input.css";
    .ui-input-slider{
        width: v-bind(sliderWidth);
        left: v-bind(sliderLeft);
        background-color: v-bind(selectedColor);
    }
    .ui-input-button{
        width: v-bind(sliderWidth);
    }
    .ui-input-active{
        opacity: 1;
    }
</style>
