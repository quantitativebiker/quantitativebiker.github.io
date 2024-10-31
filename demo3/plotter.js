var last_y_max = 1.0, last_y_min = 0.0;

draw_plot_n = function(svg_elm, data, strokes=['#f33f', '#33ff', '#3f3f', '#ff3f'],
    widths=[0.0035, 0.0035, 0.0035, 0.0035]
){
    if (!data) { 
        return;
    }
    if (data[0][0] != data[0][0] || Math.abs(data[0][1]) > 1e5) {
        return;
    }

    if (checkbox_scale_y_axis.checked) {
        var y_min = data[0][0];
        var y_max = data[0][0];

        for (i=0; i<data.length; ++i) {
            for (j=0; j<demo.NX; ++j) {
                y_min = Math.min(y_min, data[i][j]);
                y_max = Math.max(y_max, data[i][j]);
            }
        }
    } else {
        var y_max = demo.ymax;
        var y_min = demo.ymin;
    }
    last_y_max = y_max;
    last_y_min = y_min;

    paths = [];
    
    dx = 1.0 / (demo.NX-1);
    for (i=0; i<data.length; ++i) {
        x = 0.0;
        y = 0.92 - 0.85 * (data[i][0] - y_min) / (y_max - y_min);
        tmp = `M ${x} ${y}`;
        for (j=1; j<demo.NX; ++j) {
            x += dx;
            y = 0.92 - 0.85 * (data[i][j] - y_min) / (y_max - y_min);
            tmp += `L ${x}, ${y}\n`;
        }
        paths.push(tmp);
    }
    
    tmp = '';
    for (i=0; i<paths.length; ++i) {
        tmp += `<path fill="none" stroke="${strokes[i]}" stroke-width="${widths[i]}" d="${paths[i]}" />\n`;
    }

    svg_elm.innerHTML = tmp;
}
