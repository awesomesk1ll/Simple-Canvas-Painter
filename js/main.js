//выбираем покемонов
let canvas = document.querySelector('#Canvas')
let ctx = canvas.getContext('2d')
let picker = document.querySelector('#picker')
let canvas_area = document.querySelector('#canvas_area')
let x_ruler = document.querySelector('#x-ruler')
let x_ruler_ul = document.querySelector('#x-ruler-ul')
let x_marker = document.querySelector('#x-marker')
let y_ruler = document.querySelector('#y-ruler')
let y_ruler_ul = document.querySelector('#y-ruler-ul')
let y_marker = document.querySelector('#y-marker')
let palletes = document.querySelector('#palletes')
let dwnld_button = document.querySelector('#download')
let width_selector = document.querySelector("#brush_size")
let sizes = document.querySelector('#canvas_sizes')
let mouse_pos = document.querySelector('#canvas_mouse_pos')

function c_template(h, s, l) { //верстка одной hue saturation light палетки
    return `<div class="palette" style="background:hsl(${h}, ${s}%, ${l}%)" onclick="editor.select_color(this)"></div>`
}

function update(picker) { //это от колор-пикера JSColor.
    editor.color = picker.toHEXString()
}

let editor = {
    container: '#app',
    width: 530,
    height: 530,
    color: "black",
    brushstyle: "round",
    currentTool: "draw",
    fromx: 0,
    fromy: 0,
    x: 0,
    y: 0,
    isDraw: false,
    drawingBuffer: null,
    // shadow_canvas: document.createElement('canvas'),
    // shadow_ctx: null,

    init() {
        new MutationObserver(this.resize).observe(canvas_area, {
            attributes: true,
            attributeFilter: ["style"]
        })
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, 530, 530)

        // this.shadow_ctx = this.shadow_canvas.getContext('2d')
        palletes.innerHTML = this.generate_palette()

        //document.querySelector(this.container).addEventListener ('input', this.inputHandler)
        //document.querySelector(this.container).addEventListener ('click', () => console.log(event.target))

        //undo last draw
        document.addEventListener('keydown', (evt) => {
            if (evt.keyCode == 90 && evt.ctrlKey) editor.load_from_buffer()
        })

        canvas.addEventListener('mousemove', this.mouse_moving)
        canvas.addEventListener('mouseout', () => {
            this.isDraw = false
        })
        canvas.addEventListener('mousedown', this.startDraw)
        canvas.addEventListener('mouseup', this.endDraw)
        // this.shadow_save()
        this.resize()
    },
    // shadow_save() {
    // this.shadow_canvas.width = canvas.width
    // this.shadow_canvas.height = canvas.height
    // this.shadow_ctx.drawImage(canvas, 0,0)
    // },
    // shadow_load() {
    // ctx.drawImage(this.shadow_canvas, 0,0)
    // },
    resize() {
        let realToCSSPixels = window.devicePixelRatio
        // Берём заданный браузером размер canvas в CSS-пикселях и вычисляем нужный
        // нам размер, чтобы буфер отрисовки совпадал с ним в действительных пикселях
        let displayWidth = Math.floor(ctx.canvas.clientWidth * realToCSSPixels)
        let displayHeight = Math.floor(ctx.canvas.clientHeight * realToCSSPixels)
        //  проверяем, отличается ли размер canvas
        if (ctx.canvas.width !== displayWidth || ctx.canvas.height !== displayHeight) {
            let domString = ''
            // подгоняем размер буфера отрисовки под размер HTML-элемента
            ctx.canvas.width = Math.round(displayWidth / realToCSSPixels)
            ctx.canvas.height = Math.round(displayHeight / realToCSSPixels)
            //восстанавливаем буфер
            // editor.shadow_load()
            //подгоняем линейки и обновляем справочную инфу
            x_ruler.style.width = ctx.canvas.width + 'px'
            y_ruler.style.height = ctx.canvas.height + 'px'
            for (let i = 100; i < ctx.canvas.width; i += 100) {
                domString += `<li style="left: ${i+1}px;">${i}</li>`
            }
            x_ruler_ul.innerHTML = domString
            domString = '<li>0</li>'
            for (let i = 100; i < ctx.canvas.height; i += 100) {
                domString += `<li style="top: ${i-1}px;">${i}</li>`
            }
            y_ruler_ul.innerHTML = domString
            sizes.innerHTML = `Ширина: ${ctx.canvas.width} px<br>
			Высота: ${ctx.canvas.height} px`
        }
    },
    select_color(palette) {
        editor.color = palette.style.background
        picker.jscolor.fromString(editor.color)
    },
    draw() {
        if (this.currentTool == "draw") {
            ctx.lineTo(this.x, this.y)
            ctx.lineWidth = this.line_size()
            ctx.lineJoin = 'round'
            ctx.lineCap = this.brushstyle
            ctx.strokeStyle = this.color
            ctx.stroke()
        } else { // "rectangle"
            ctx.fillStyle = this.color
            ctx.fillRect(Math.min(editor.fromx, editor.x), Math.min(editor.fromy, editor.y), Math.abs(editor.fromx - editor.x), Math.abs(editor.fromy - editor.y))
        }
    },
    generate_palette() {
        let domString = ''
        domString += c_template(0, 0, 0) + c_template(0, 0, 65) + c_template(0, 0, 79); // ЧЕРНАЯ строчка палетки
        for (let i = 0; i <= 11; i++) {
            domString += c_template(i * 30, 100, 50) + c_template(i * 30, 85, 65) + c_template(i * 30, 83, 79); // Цветная строчка палетки
        }
        return domString
    },
    mouse_moving(evt) {
        if (editor.isDraw)
            editor.draw()
        editor.x = evt.offsetX
        editor.y = evt.offsetY
        x_marker.style.left = editor.x + "px"
        y_marker.style.top = editor.y + "px"
        mouse_pos.innerHTML = `x: ${editor.x}<br>y: ${editor.y}`
    },
    changeBrushStyle(obj) {
        this.currentTool = "draw"
        this.brushstyle = obj.id
    },
    line_size() {
        return width_selector.value
    },
    copy() {
        canvas.toBlob(function(blob) {
            const item = new ClipboardItem({
                "image/png": blob
            })
            navigator.clipboard.write([item])
            console.log("Картинка скопирована в буфер обмена!")
        })
    },
    erase() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
    save() {
        let dataURL = canvas.toDataURL('image/png')
        let name = new Date(Date.now()).toLocaleString().split(':').join('-').replace(', ', '-')
        dwnld_button.href = dataURL
        dwnld_button.download = 'scp_' + name + '.png'
    },
    save_to_buffer() {
        editor.drawingBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height)
    },
    load_from_buffer() {
        if (editor.drawingBuffer != null)
            ctx.putImageData(editor.drawingBuffer, 0, 0)
    },
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    startDraw(evt) {
        editor.save_to_buffer()
        editor.x = evt.offsetX
        editor.y = evt.offsetY
        editor.fromx = editor.x
        editor.fromy = editor.y
        ctx.beginPath()
        ctx.moveTo(editor.x, editor.y)
        editor.isDraw = true

        editor.draw()
    },
    endDraw() {
        editor.isDraw = false
    },
}

editor.init()