/*
 Stanislav Sumbera, August , 2015
 - scaled SVG draw prototype on top of Leaflet 1.0 beta 
 - note it uses L.map patch to get it working right
 - SVG data are not modified, only scaled and optionaly radius/stroke width etc. can be specified on onScaleChange callback
 
  - very experimental
*/
//-- Patch to get leaflet properly zoomed
L.Map.prototype.latLngToLayerPoint = function (latlng) { // (LatLng)
    var projectedPoint = this.project(L.latLng(latlng));//._round();
    return projectedPoint._subtract(this.getPixelOrigin());
};

L.Map.prototype._getNewPixelOrigin = function (center, zoom) {
    var viewHalf = this.getSize()._divideBy(2);
    return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos());//._round();
};
// -- from leaflet 1.0 to get this working right on  v 0.7 too
L.Map.prototype.getZoomScale = function (toZoom, fromZoom) {
    var crs = this.options.crs;
    fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
    return crs.scale(toZoom) / crs.scale(fromZoom);
};

var svg_url = "";

L.SVGScaleOverlay = L.Class.extend({
    options: {
        pane: 'overlayPane',
        nonBubblingEvents: [],  // Array of events that should not be bubbled to DOM parents (like the map)
        // how much to extend the clip area around the map view (relative to its size)
        // e.g. 0.1 would be 10% of map view in each direction; defaults to clip with the map view
        padding: 0
    },

    isLeafletVersion1: function () {
        return L.Layer ? true : false;
    },
    initialize: function (options) {
        svg_url = options.svg_url;
        L.setOptions(this, options);
        L.stamp(this);
    },

    // ----------------------------------------------------------------------------------
    getScaleDiff:function(zoom) {
        var zoomDiff = this._groundZoom - zoom;
        var scale = (zoomDiff < 0 ? Math.pow(2, Math.abs(zoomDiff)) : 1 / (Math.pow(2, zoomDiff)));
        return scale;
    },

    initSvgContainer: function () {
        console.log("in initSvgContainer");
        this._svg;
        this._map ;
        d3.xml(svg_url).mimeType("image/svg+xml").get(function(error, svgImg) {
            if (error) throw error;
              svgImg_doc = svgImg.documentElement;
            //   console.log(svgImg.documentElement);
            //   console.log(svgImg);
            
            //  document.appendChild(svgImg.documentElement);
             this._map =  this.svgOverlay._map;
               this.svgOverlay._map.getPanes().overlayPane.appendChild(svgImg.documentElement);
            //   this._svg.addClass('leaflet-zoom-hide');
            overlayClass=this.svgOverlay._map.getPanes().overlayPane.className.replace(/ /g, '.');
            // overlayClass
              this._svg =  $('.'+ overlayClass +' svg')[0];
              this._g =  $('.'+ overlayClass +' svg g');
              
               console.log(this._svg);
               initAfterSVGLoad();
        });
        // var xmlns = "http://www.w3.org/2000/svg";
        // this._svg = document.createElementNS(xmlns, "svg");
        // console.log("2",this._svg);
        // this._g = this._svg.g;
        
        // if (!this.isLeafletVersion1()) {
        //     L.DomUtil.addClass(this._g, 'leaflet-zoom-hide');
        // }
        

    },
    initAfterSVGLoad : function () {
        var size = this._map.getSize();
        this._svgSize = size;
        this._svg.setAttribute('width', size.x);
        this._svg.setAttribute('height', size.y);
       
        // console.log(this._map.getSize());
        // this._svg.appendChild(this._g);

           


        this._groundZoom = this._map.getZoom();

        this._shift = new L.Point(0, 0);
        this._lastZoom = this._map.getZoom();

        var bounds = this._map.getBounds();
        this._lastTopLeftlatLng = new L.LatLng(bounds.getNorth(), bounds.getWest()); ////this._initialTopLeft     = this._map.layerPointToLatLng(this._lastLeftLayerPoint);  
    },

    resize: function (e) {
        var size = this._map.getSize();
        this._svgSize = size;
        this._svg.setAttribute('width', size.x);
        this._svg.setAttribute('height', size.y);
    },
    moveEnd: function (e) {
        var bounds = this._map.getBounds();
        var topLeftLatLng      = new L.LatLng(bounds.getNorth(), bounds.getWest());
        var topLeftLayerPoint  = this._map.latLngToLayerPoint(topLeftLatLng);
        var lastLeftLayerPoint = this._map.latLngToLayerPoint(this._lastTopLeftlatLng);

        var zoom = this._map.getZoom();
        var scaleDelta = this._map.getZoomScale(zoom, this._lastZoom);
        var scaleDiff = this.getScaleDiff(zoom);

        if (this._lastZoom != zoom) {
            if (typeof (this.onScaleChange) == 'function') {
                this.onScaleChange(scaleDiff);
            }
        }
        this._lastZoom = zoom;
        var delta = lastLeftLayerPoint.subtract(topLeftLayerPoint);

        this._lastTopLeftlatLng = topLeftLatLng;
        L.DomUtil.setPosition(this._svg, topLeftLayerPoint);
        
           
           
        this._shift._multiplyBy(scaleDelta)._add(delta);
        this._g.setAttribute("transform", "translate(" + this._shift.x + "," + this._shift.y + ") scale(" + scaleDiff + ")"); // --we use viewBox instead

    },

    animateSvgZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom, this._lastZoom),
		    offset = this._map._latLngToNewLayerPoint(this._lastTopLeftlatLng, e.zoom, e.center);

        L.DomUtil.setTransform(this._svg, offset, scale);
    },

    getEvents: function () {
        var events = {
             resize: this.resize,
            moveend: this.moveEnd
        };
        if (this._zoomAnimated && this.isLeafletVersion1()) {
           // events.zoomanim = this.animateSvgZoom;
        }
        return events;
    },
    /* from Layer , extension  to get it worked on lf 1.0, this is not called on ,1. versions */
    _layerAdd: function (e) { this.onAdd(e.target); },

    /*end Layer */
    onAdd: function (map) {
        // -- from _layerAdd
        // check in case layer gets added and then removed before the map is ready
        if (!map.hasLayer(this)) { return; }

        this._map = map;
        this._zoomAnimated = map._zoomAnimated;

        // --onAdd leaflet 1.0
        if (!this._svg) {
            this.initSvgContainer();

            if (this._zoomAnimated) {
                //L.DomUtil.addClass(this._svg, 'leaflet-zoom-animated');
                L.DomUtil.addClass(this._svg, 'leaflet-zoom-hide');
            }
        }

        var pane = this._map.getPanes().overlayPane;
        pane.appendChild(this._svg);
        

        if (typeof (this.onInitData) == 'function') {
            this.onInitData(svgUrl);
        }


      //---------- from _layerAdd
        if (this.getAttribution && this._map.attributionControl) {
            this._map.attributionControl.addAttribution(this.getAttribution());
        }

        if (this.getEvents) {
            map.on(this.getEvents(), this);
        }
        map.fire('layeradd', { layer: this });
    },

    onRemove: function () {
        L.DomUtil.remove(this._svg);
    }

});



L.SvgScaleOverlay = function (options) {
    return new L.SVGScaleOverlay(options);
};