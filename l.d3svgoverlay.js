/**
 * Copyright 2015 Teralytics AG
 *
 * @author Kirill Zhuravlev <kirill.zhuravlev@teralytics.ch>
 *
 */

(function (factory) {
   if (typeof define === 'function' && define.amd) {
       define(['leaflet', 'd3'], factory);
   } else if (typeof module === 'object' && module.exports) {
       module.exports = factory(require('leaflet', 'd3'));
   } else {
       factory(L, d3);
   }
}(function (L, d3) {

// Check requirements
if (typeof d3 == "undefined") {
    throw "D3 SVG Overlay for Leaflet requires D3 library loaded first";
}
if (typeof L == "undefined") {
    throw "D3 SVG Overlay for Leaflet requires Leaflet library loaded first";
}

// Tiny stylesheet bundled here instead of a separate file
// if (L.version >= "1.0") {
//     d3.select("head")
//         .append("style").attr("type", "text/css")
//         .text("g.d3-overlay *{pointer-events:visiblePainted;}");
// }

// Class definition
L.D3SvgOverlay = (L.version < "1.0" ? L.Class : L.Layer).extend({
    includes: (L.version < "1.0" ? L.Mixin.Events : []),

    _undef: function(a){ return typeof a == "undefined" },

    _options: function (options) {
        if (this._undef(options)) {
            return this.options;
        }
        options.zoomHide = this._undef(options.zoomHide) ? false : options.zoomHide;
        options.zoomDraw = this._undef(options.zoomDraw) ? true : options.zoomDraw;

        return this.options = options;
    },

    _disableLeafletRounding: function(){
        this._leaflet_round = L.Point.prototype._round;
        L.Point.prototype._round = function(){ return this; };
    },

    _enableLeafletRounding: function(){
        L.Point.prototype._round = this._leaflet_round;
    },

    draw: function () {
        // this._disableLeafletRounding();
        this._drawCallback(this.selection, this.projection, this.map.getZoom());
        // this._enableLeafletRounding();
    },

    initialize: function (drawCallback, options) { // (Function(selection, projection)), (Object)options
        this._options(options || {});
        this._drawCallback = drawCallback;
    },

    // Handler for "viewreset"-like events, updates scale and shift after the animation
    _zoomChange: function (evt) {
        var bounds = this.map.getBounds();
         this._lastTopLeftlatLng  = new L.LatLng(bounds.getNorth(), bounds.getWest());
        // console.log("map is", this.map);
        // console.log("zoom is", evt.target._zoom);
        // this._disableLeafletRounding();
        var newZoom = this._undef(evt.target._zoom) ? this.map._zoom : evt.target._zoom; // "viewreset" event in Leaflet has not zoom/center parameters like zoomanim
        this._zoomDiff = newZoom - this._zoom;
        this._scale = Math.pow(2, this._zoomDiff);
        this.projection.scale = this._scale;
        this._shift = this.map.latLngToLayerPoint(this._wgsOrigin)
            ._subtract(this._wgsInitialShift.multiplyBy(this._scale*0.1));
        var shift = ["translate(", this._shift.x, ",", this._shift.y, ") "];
        var scale = ["scale(", this._scale, ",", this._scale,") "];
        // console.log("this._scale", this._scale);
        // this._rootGroup.attr("transform", shift.concat(scale).join(""));
        $.each(this._rootGroup, function (key, val){
            // console.log(val.id);
            if(val.id){
                $("#"+val.id).attr("transform", shift.concat(scale).join(""));
            }
        });
        if (this.options.zoomDraw) { this.draw() }
        // this._enableLeafletRounding();
    },

    onAdd: function (map) {
        this.map = map;
        // console.log(this.map);
        var _layer = this;
        this._svgGroups = [];
        overlayClass=this.map.getPanes().overlayPane.className.replace(/ /g, '.');
        // console.log("this.map.getPanes().overlayPane ",this.map.getPanes().overlayPane.className);
        // SVG element
        if (L.version < "1.0") {
            map._initPathRoot();
            this._svg = $('.'+ overlayClass +' svg');// d3.select(map._panes.overlayPane).select("svg");//$('.'+ overlayClass +' svg');//this.map.getPanes().overlayPane.children[0];
            // this._svg = this.map.getPanes().overlayPane.children[1];
            this._svg.attr("class","leaflet-zoom-animated");
            
            
            temp_g = [];
            $('.'+ overlayClass +' svg').children().each (function (key,val){
                $("#"+val.id).attr("class","leaflet-zoom-animated");
                temp_g.push(val);
            });
            this._svgGroups = temp_g;
            // this._rootGroup = this._svg.append("g"); 
            this._rootGroup =this._svgGroups; 
            // console.log("this._rootGroup",this._rootGroup);
            
            // console.log("this._svgGroups",this._svgGroups);
        } else {
            this._svg = $('.'+ overlayClass +' svg');
            // this._svg = L.svg();
            // map.addLayer(this._svg);
            // this._rootGroup = d3.select(this._svg._rootGroup).classed("d3-overlay", true);
            overlayClass=this.map.getPanes().overlayPane.className.replace(/ /g, '.');
            temp_g = [];
            $('.'+ overlayClass +' svg').children().each (function (key,val){
                temp_g.push(val);
            });
            this._svgGroups = temp_g;
            this._rootGroup =this._svgGroups; 
        }
        
        //  console.log("this.map.getPanes().overlayPane ",this.map.getPanes().overlayPane.children[0],this.map.getPanes().overlayPane.children[1]);
        // this._rootGroup.classed("leaflet-zoom-hide", this.options.zoomHide);
        if(this.options.zoomHide) {
            $.each(this._rootGroup, function (key, val){
                val.classed("leaflet-zoom-hide", true);
            });
        }
        // console.log("this._rootGroup",this._rootGroup);
        this.selection = this._rootGroup;

        // Init shift/scale invariance helper values
        this._pixelOrigin = map.getPixelOrigin();
        this._wgsOrigin = L.latLng([0, 0]);
        this._wgsInitialShift = this.map.latLngToLayerPoint(this._wgsOrigin);
        this._zoom = this.map.getZoom();
        this._shift = L.point(0, 0);
        this._scale = 1;

        // Create projection object
        this.projection = {
            latLngToLayerPoint: function (latLng, zoom) {
                zoom = _layer._undef(zoom) ? _layer._zoom : zoom;
                var projectedPoint = _layer.map.project(L.latLng(latLng), zoom)._round();
                return projectedPoint._subtract(_layer._pixelOrigin);
            },
            layerPointToLatLng: function (point, zoom) {
                zoom = _layer._undef(zoom) ? _layer._zoom : zoom;
                var projectedPoint = L.point(point).add(_layer._pixelOrigin);
                return _layer.map.unproject(projectedPoint, zoom);
            },
            unitsPerMeter: 256 * Math.pow(2, _layer._zoom) / 40075017,
            map: _layer.map,
            layer: _layer,
            scale: 1
        };
        this.projection._projectPoint = function(x, y) {
            var point = _layer.projection.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        };
        // this.projection.pathFromGeojson = d3.geo.path().projection(d3.geo.transform({point: this.projection._projectPoint}));
        // console.log("projection.pathFromGeojson",this.projection.pathFromGeojson);
        // Compatibility with v.1
        this.projection.latLngToLayerFloatPoint = this.projection.latLngToLayerPoint;
        this.projection.getZoom = this.map.getZoom.bind(this.map);
        this.projection.getBounds = this.map.getBounds.bind(this.map);
        this.selection = this._rootGroup;

        if (L.version < "1.0"){
            map.on("viewreset", this._zoomChange, this);
            map.on('zoomanim', this._animateZoom, this);
        }

        // Initial draw
        this.draw();
    },

    // Leaflet 1.0
    getEvents: function() { return {zoomend: this._zoomChange}; },

    onRemove: function (map) {
        if (L.version < "1.0") {
            map.off("viewreset", this._zoomChange, this);
            this._rootGroup.remove();
        } else {
            this._svg.remove();
        }
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },
    scaleMarker_coords: function (val) {
        console.log(this._scale);
        return val*this._scale;
    },
    _animateZoom: function (e) {
        console.log(e);
        //  var bounds = this.map.getBounds();
        //  this._lastTopLeftlatLng  = new L.LatLng(bounds.getNorth(), bounds.getWest());
        // console.log("map is", this.map);
        // console.log("zoom is", evt.target._zoom);
        // this._disableLeafletRounding();
        var newZoom = e.zoom; // "viewreset" event in Leaflet has not zoom/center parameters like zoomanim
        this._zoomDiff = newZoom - this._zoom;
        this._scale = Math.pow(2, this._zoomDiff);
        // this.projection.scale = this._scale;
        console.log(newZoom,this._zoomDiff, this._scale,this._wgsOrigin, e.center );
        this._shift = this.map.latLngToLayerPoint(this._wgsOrigin)
            ._subtract(this._wgsInitialShift.multiplyBy(this._scale*0.1));
        var shift = ["translate(", this._shift.x, ",", this._shift.y, ") "];
        var scale = ["scale(", this._scale, ",", this._scale,") "];
        // console.log("this._scale", this._scale);
        // this._rootGroup.attr("transform", shift.concat(scale).join(""));
        $.each(this._rootGroup, function (key, val){
            // console.log(val.id);
            if(val.id){
                $("#"+val.id).attr("transform", shift.concat(scale).join(""));
            }
        });
        console.log(("transform", shift.concat(scale).join("")))l
	}

});

L.D3SvgOverlay.version = "2.2";

// Factory method
L.d3SvgOverlay = function (drawCallback, options) {
    return new L.D3SvgOverlay(drawCallback, options);
};

}));