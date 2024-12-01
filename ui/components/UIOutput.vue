<template>
    <div class="ui-output-container">
        <div class="ui-output-header">
            <div class="ui-output-label">{{ props.label }}</div>
            <div
                class="ui-output-display"
                :style="[ toDisplay == 'ERR' ? { color: 'red' } : {} ]"
            >
                {{ toDisplay }}
            </div>
        </div>
        <div class="ui-output-wrapper ui-output-round">
            <div class="ui-output-slider-wrapper">
                <div class="ui-output-slider ui-output-round" />
            </div>
            <div class="ui-output-body">
                <div v-for="option in options" :key="option.index" :value="option.value" :class="[option.index == selectedIndex ? 'ui-output-active' : '', 'ui-output-button']" @click="onChange(option)">
                    {{ option.label }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'UIOutput',
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
            return `${((100 / this.props.options.length) * this.selection?.index)}%`
        },
        selectedColor: function () {
            return this.props.useThemeColors ? 'rgb(var(--v-theme-primary))' : this.selection?.color
        },
        selectedIndex: function () {
            return this.selection?.index
        },
        toDisplay: function () {
            return (this.display !== '') ? this.display : ''
        }
    },
    created () {
        this.$dataTracker(this.id, this.onInput, this.onLoad)
        this.$socket.emit('widget-load', this.id)
    },
    mounted () {
        this.selection = this.messages[this.id]?.payload
        this.display = this.messages[this.id]?.display
        this.$socket.on('msg-display:' + this.id, (val) => {
            this.display = val
        })
    },
    unmounted () {
        this.$socket.off('msg-display')
    },
    methods: {
        onLoad (msg) {
            if (msg) {
                this.$store.commit('data/bind', {
                    widgetId: this.id,
                    msg
                })
                this.selection = msg.payload
                this.display = msg.display
            }
        },
        onChange (value) {
            this.selection = value
            this.display = value.value === 'func' ? value.label : value.value
            this.$socket.emit('widget-change', this.id, { payload: value, display: this.display })
        }
        // onInput (msg) {
        //     if (msg.display) { this.display = msg.display }
        // }
    }
}
</script>

<style scoped>
    @import "../stylesheets/ui-output.css";
    .ui-output-slider{
        width: v-bind(sliderWidth);
        left: v-bind(sliderLeft);
        background-color: v-bind(selectedColor);
    }
    .ui-output-button{
        width: v-bind(sliderWidth);
    }
    .ui-output-active{
        color: rgb(var(--v-theme-surface));
    }
    .ui-output-display{
        color: v-bind(selectedColor);
    }
</style>
