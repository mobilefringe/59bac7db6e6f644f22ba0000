o.ImageOverlay = o.Layer.extend({
        options: {
            opacity: 1,
            alt: "",
            interactive: !1
        },
        initialize: function(t, e, i) {
            this._url = t,
            this._bounds = o.latLngBounds(e),
            o.setOptions(this, i)
        },
        onAdd: function() {
            this._image || (this._initImage(),
            this.options.opacity < 1 && this._updateOpacity()),
            this.options.interactive && (o.DomUtil.addClass(this._image, "leaflet-interactive"),
            this.addInteractiveTarget(this._image)),
            this.getPane().appendChild(this._image),
            this._reset()
        },
        onRemove: function() {
            o.DomUtil.remove(this._image),
            this.options.interactive && this.removeInteractiveTarget(this._image)
        },
        setOpacity: function(t) {
            return this.options.opacity = t,
            this._image && this._updateOpacity(),
            this
        },
        setStyle: function(t) {
            return t.opacity && this.setOpacity(t.opacity),
            this
        },
        bringToFront: function() {
            return this._map && o.DomUtil.toFront(this._image),
            this
        },
        bringToBack: function() {
            return this._map && o.DomUtil.toBack(this._image),
            this
        },
        setUrl: function(t) {
            return this._url = t,
            this._image && (this._image.src = t),
            this
        },
        getAttribution: function() {
            return this.options.attribution
        },
        getEvents: function() {
            var t = {
                zoom: this._reset,
                viewreset: this._reset
            };
            return this._zoomAnimated && (t.zoomanim = this._animateZoom),
            t
        },
        getBounds: function() {
            return this._bounds
        },
        getElement: function() {
            return this._image
        },
        _initImage: function() {
            var t = this._image = o.DomUtil.create("img", "leaflet-image-layer " + (this._zoomAnimated ? "leaflet-zoom-animated" : ""));
            t.onselectstart = o.Util.falseFn,
            t.onmousemove = o.Util.falseFn,
            t.onload = o.bind(this.fire, this, "load"),
            this.options.crossOrigin && (t.crossOrigin = ""),
            t.src = this._url,
            t.alt = this.options.alt
        },
        _animateZoom: function(t) {
            var e = this._map.getZoomScale(t.zoom)
              , i = this._map._latLngToNewLayerPoint(this._bounds.getNorthWest(), t.zoom, t.center);
            o.DomUtil.setTransform(this._image, i, e)
        },
        _reset: function() {
            var t = this._image
              , e = new o.Bounds(this._map.latLngToLayerPoint(this._bounds.getNorthWest()),this._map.latLngToLayerPoint(this._bounds.getSouthEast()))
              , i = e.getSize();
            o.DomUtil.setPosition(t, e.min),
            t.style.width = i.x + "px",
            t.style.height = i.y + "px"
        },
        _updateOpacity: function() {
            o.DomUtil.setOpacity(this._image, this.options.opacity)
        }
    }),
    o.imageOverlay = function(t, e, i) {
        return new o.ImageOverlay(t,e,i)
    }