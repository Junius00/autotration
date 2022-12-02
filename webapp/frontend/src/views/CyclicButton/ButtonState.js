export default class ButtonState {
    constructor(value, onClick, bgColor = '#333333', textColor = '#FFFFFF') {
        this.value = value;
        this.onClick = onClick;
        this.textColor = textColor;
        this.bgColor = bgColor;
    }
};