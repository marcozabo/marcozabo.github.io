// Helpers
shuffle = function(o) {
    for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

String.prototype.hashCode = function() {
    // See http://www.cse.yorku.ca/~oz/hash.html        
    var hash = 5381;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) + hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
}

// List of venues. These are foursquare IDs, with the idea that eventually it'll tie in 
venues = {
    "116208": "Stalingrado",
    "66271": "Beef",
    "5518": "Piccolo padre",
    "392360": "Il Bue e la patata",
    "2210952": "Pesciolino",
    "207306": "Gecko",
    "41457": "Old School",
    "101161": "Piccola Ischia",
    "257424": "CookBook",
    "512060": "Piadineria piero della Francesca",
    "66244": "Piadineria Arco della pace",
    "352867": "Chatoulle",
    "22493": "Acquarius",
    "268052": "Briscola",
    "5665": "Sciuscia",
    "129724": "Marcellino pane e vino",
    "42599": "Spontini",
    "422329": "Garage",
    "42354": "Fratelli la bufala",
    "423768": "Monopoli",
    "455643": "Old wild west",
    "233344": "Noma29",
    "64356": "Antico forno",
    "74657": "Milk & food",
    "42555": "La taverna della trisa",
    "45633": "Little Italy",
    "34555": "Le pietre cavate",
    "41115": "Osteria del borgo antico",
    "11115": "Osteria delle corti",
    "451287": "La stazione",
    "987543": "Arabesco",
    "6563511": "Gattamelata",
    "876522": "Osteria via appia",
    "3454344": "Bar Vigorelli",
    "1234344": "Il toscanaccio",
    "8764024": "Donna Titina",
    "5326542": "Anema e cozze"
};

$(function() {

    var venueContainer = $('#venues ul');
    $.each(venues, function(key, item) {
        venueContainer.append(
        $(document.createElement("li")).append(
        $(document.createElement("input")).attr({
            id: 'venue-' + key,
            name: item,
            value: item,
            type: 'checkbox',
            checked: true
        }).change(function() {
            var cbox = $(this)[0];
            var segments = wheel.segments;
            var i = segments.indexOf(cbox.value);

            if (cbox.checked && i == -1) {
                segments.push(cbox.value);

            } else if (!cbox.checked && i != -1) {
                segments.splice(i, 1);
            }

            segments.sort();
            wheel.update();
        })

        ).append(
        $(document.createElement('label')).attr({
            'for': 'venue-' + key
        }).text(item)))
    });

    $('#venues ul>li').sort("input", {
        attr: "value"
    });
});

// WHEEL!
var wheel = {

    timerHandle: 0,
    timerDelay: 33,

    angleCurrent: 0,
    angleDelta: 0,

    size: 290,

    canvasContext: null,

    colors: ['#ffff00', '#ffc700', '#ff9100', '#ff6301', '#ff0000', '#c6037e',
             '#713697', '#444ea1', '#2772b2', '#0297ba', '#008e5b', '#8ac819'],

    segments: [],

    seg_colors: [],
    // Cache of segments to colors
    maxSpeed: Math.PI / 16,

    upTime: 1000,
    // How long to spin up for (in ms)
    downTime: 5000,
    // How long to slow down for (in ms)
    spinStart: 0,

    frames: 0,

    centerX: 300,
    centerY: 300,

    spin: function() {

        // Start the wheel only if it's not already spinning
        if (wheel.timerHandle == 0) {
            wheel.spinStart = new Date().getTime();
            wheel.maxSpeed = Math.PI / (16 + Math.random()); // Randomly vary how hard the spin is
            wheel.frames = 0;

            wheel.timerHandle = setInterval(wheel.onTimerTick, wheel.timerDelay);
        }
    },

    onTimerTick: function() {

        wheel.frames++;

        wheel.draw();

        var duration = (new Date().getTime() - wheel.spinStart);
        var progress = 0;
        var finished = false;

        if (duration < wheel.upTime) {
            progress = duration / wheel.upTime;
            wheel.angleDelta = wheel.maxSpeed * Math.sin(progress * Math.PI / 2);
        } else {
            progress = duration / wheel.downTime;
            wheel.angleDelta = wheel.maxSpeed * Math.sin(progress * Math.PI / 2 + Math.PI / 2);
            if (progress >= 1) finished = true;
        }

        wheel.angleCurrent += wheel.angleDelta;
        while (wheel.angleCurrent >= Math.PI * 2)
        // Keep the angle in a reasonable range
        wheel.angleCurrent -= Math.PI * 2;

        if (finished) {
            clearInterval(wheel.timerHandle);
            wheel.timerHandle = 0;
            wheel.angleDelta = 0;

        }
    },

    init: function(optionList) {
        try {
            wheel.initWheel();
            wheel.initCanvas();
            wheel.draw();

            $.extend(wheel, optionList);

        } catch (exceptionData) {
            alert('Wheel is not loaded ' + exceptionData);
        }

    },


    initCanvas: function() {
        var canvas = $('#wheel #canvas').get(0);

        if ($.browser.msie) {
            canvas = document.createElement('canvas');
            $(canvas).attr('width', 1000).attr('height', 600).attr('id', 'canvas').appendTo('.wheel');
            canvas = G_vmlCanvasManager.initElement(canvas);
        }

        canvas.addEventListener("click", wheel.spin, false);
        wheel.canvasContext = canvas.getContext("2d");
    },

    initWheel: function() {
        shuffle(wheel.colors);
    },

    // Called when segments have changed
    update: function() {
        // Ensure we start mid way on a item
        //var r = Math.floor(Math.random() * wheel.segments.length);
        var r = 0;
        wheel.angleCurrent = ((r + 0.5) / wheel.segments.length) * Math.PI * 2;

        var segments = wheel.segments;
        var len = segments.length;
        var colors = wheel.colors;
        var colorLen = colors.length;

        // Generate a color cache (so we have consistant coloring)
        var seg_color = new Array();
        for (var i = 0; i < len; i++)
        seg_color.push(colors[segments[i].hashCode().mod(colorLen)]);

        wheel.seg_color = seg_color;

        wheel.draw();
    },

    draw: function() {
        wheel.clear();
        wheel.drawWheel();
        wheel.drawNeedle();
    },

    clear: function() {
        var ctx = wheel.canvasContext;
        ctx.clearRect(0, 0, 1000, 800);
    },

    drawNeedle: function() {
        var ctx = wheel.canvasContext;
        var centerX = wheel.centerX;
        var centerY = wheel.centerY;
        var size = wheel.size;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fileStyle = '#ffffff';

        ctx.beginPath();

        ctx.moveTo(centerX + size - 40, centerY);
        ctx.lineTo(centerX + size + 20, centerY - 10);
        ctx.lineTo(centerX + size + 20, centerY + 10);
        ctx.closePath();

        ctx.stroke();
        ctx.fill();

        // Which segment is being pointed to?
        var i = wheel.segments.length - Math.floor((wheel.angleCurrent / (Math.PI * 2)) * wheel.segments.length) - 1;

        // Now draw the winning name
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = '#000000';
        ctx.font = "2em Arial";
        ctx.fillText(wheel.segments[i], centerX + size + 25, centerY);
    },

    drawSegment: function(key, lastAngle, angle) {
        var ctx = wheel.canvasContext;
        var centerX = wheel.centerX;
        var centerY = wheel.centerY;
        var size = wheel.size;

        var segments = wheel.segments;
        var len = wheel.segments.length;
        var colors = wheel.seg_color;

        var value = segments[key];

        ctx.save();
        ctx.beginPath();

        // Start in the centre
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, size, lastAngle, angle, false); // Draw a arc around the edge
        ctx.lineTo(centerX, centerY); // Now draw a line back to the centre
        ctx.closePath();

        ctx.fillStyle = colors[key];
        ctx.fill();
        ctx.stroke();

        // Now draw the text
        ctx.save(); // The save ensures this works on Android devices
        ctx.translate(centerX, centerY);
        ctx.rotate((lastAngle + angle) / 2);

        ctx.fillStyle = '#000000';
        ctx.fillText(value.substr(0, 20), size / 2 + 20, 0);
        ctx.restore();

        ctx.restore();
    },

    drawWheel: function() {
        var ctx = wheel.canvasContext;

        var angleCurrent = wheel.angleCurrent;
        var lastAngle = angleCurrent;

        var segments = wheel.segments;
        var len = wheel.segments.length;
        var colors = wheel.colors;
        var colorsLen = wheel.colors.length;

        var centerX = wheel.centerX;
        var centerY = wheel.centerY;
        var size = wheel.size;

        var PI2 = Math.PI * 2;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = "1.4em Arial";

        for (var i = 1; i <= len; i++) {
            var angle = PI2 * (i / len) + angleCurrent;
            wheel.drawSegment(i - 1, lastAngle, angle);
            lastAngle = angle;
        }
        // Draw a center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, PI2, false);
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.fill();
        ctx.stroke();

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, PI2, false);
        ctx.closePath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        ctx.shadowColor = '#999';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.stroke();
    },
}

window.onload = function() {
    wheel.init();

    var segments = new Array();
    $.each($('#venues input:checked'), function(key, cbox) {
        segments.push(cbox.value);
    });

    wheel.segments = segments;
    wheel.update();

    // Hide the address bar (for mobile devices)!
    setTimeout(function() {
        window.scrollTo(0, 1);
    }, 0);
}