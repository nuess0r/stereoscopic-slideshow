/* global AFRAME, THREE */
AFRAME.registerComponent("gallery-controller", (function(){
    const Controller = {};

    /*********************
     * Internal properties
     *********************/
    const vrHeadsetImgYOffset = 1.2;
    const vrHeadsetImgZOffset = -0.45;
    const minUiZDistance = -0.5;
    const maxUiZDistance = -2;
    const uiZDistanceStep = 0.5
    const stereoImageId = 'fullsize-image'
    const _stereoImage = '#'+stereoImageId;

    let galleryController, sceneEl, leye, reye, $descriptionText, descriptionText,
        $body, $scene, $mask, $sceneEntities, $assets, $imageLoading,
        $imageLoadError, sceneMaterial, textureLoader;

    /*********************
     * Public properties
     *********************/
    Controller.shouldEnterVR = false;
    Controller.isInVR = false;
    Controller.isImmersiveVRSupported = false;
    Controller.isLoadingStereoImage = false;
    Controller.el;

    /*********************
     * Internal functions
     *********************/
    const init = function(){
        Controller.el = galleryController.el;
        sceneEl = Controller.el.sceneEl;
        sceneMaterial = sceneEl.systems.material;
        textureLoader = new THREE.TextureLoader();
        leye = jQuery('#left-image')[0];
        reye = jQuery('#right-image')[0];
        $descriptionText = jQuery('#description-text');
        descriptionText = $descriptionText[0];
        $scene = jQuery('#scene');
        $mask = jQuery('#mask');
        $assets = jQuery('#assets');
        $imageLoading = jQuery('#image-loading');
        $imageLoadError = jQuery('#image-load-error');
        $body = jQuery('body');

        if(Controller.isImmersiveVRSupported){
            $body.addClass('vr-supported');
            $sceneEntities = jQuery(Controller.el).find('> *');
            $sceneEntities.each((i, entity) => {
                let position = entity.getAttribute('position');
                position.y += vrHeadsetImgYOffset;
                position.z += vrHeadsetImgZOffset;
                entity.setAttribute('position', position);
            });
            Utils.setAttributeOnEntityNodelist(jQuery('#exit-button a-entity[text]'), 'text', 'value', 'Exit VR');
        }else{
            $body.addClass('vr-unsupported');
            Utils.setAttributeOnEntityNodelist(jQuery('.vr-only'), 'visible', false);
        }
        $body.addClass('vr-support-resolved');

        leye.setAttribute("material", "src", _stereoImage);
        reye.setAttribute("material", "src", _stereoImage);

        sceneEl.addEventListener('enter-vr', Controller.onEnterVR.bind(this), false);
        sceneEl.addEventListener('exit-vr', Controller.onExitVR.bind(this), false);
    };

    const onIsSessionSupported = function(isSupported){
        Controller.isImmersiveVRSupported = isSupported;
        onNamespacesLoaded([
            'Components.Utils'
        ], function(){
            Utils = Components.Utils;
            init();
        });
    };

    const removeStereoImage = function(){
        let $stereoImage = jQuery(_stereoImage);
        if($stereoImage.length){
            let stereoImage = $stereoImage[0];
            stereoImage.onload = stereoImage.onerror = null;
            $stereoImage.attr('src', '').remove();
            $stereoImage = stereoImage = null;
        }
        Controller.isLoadingStereoImage = false;
    };

    const unloadTextureFromEyePlane = function(element){
        const material = element.getObject3D("mesh").material;
        if(material.map){
            material.map.dispose();
            material.map = null;
            material.needsUpdate = true;
        }
    };

    const loadStereoImage = function(stereoImageId, url, description, aspect){
        let stereoImage = document.createElement('img');
        stereoImage.setAttribute('id', stereoImageId);
        stereoImage.setAttribute('crossorigin', "anonymous");
        stereoImage.setAttribute('src', url);
        stereoImage.setAttribute('alt', description);
        stereoImage.setAttribute('aspect', aspect);
        stereoImage.onload = onImgLoaded;
        stereoImage.onerror = onImageLoadError;
        jQuery(stereoImage).appendTo($assets);
    };

    const unloadStereoImage = function(){
        removeStereoImage();
        setStereoImageVisibility(false);
    };

    const setStereoImageVisibility = function(visible){
        leye.setAttribute("visible", visible)
        reye.setAttribute("visible", visible)
    };

    const onImgLoaded = function (){
        let $stereoImage = jQuery(_stereoImage);
        if($stereoImage.length){
            let stereoImage = $stereoImage[0];
            //LOAD TEXTURE and on completion apply it on plane
            textureLoader.load(stereoImage.getAttribute('src'),
                texture => {
                    texture.repeat = { x: 0.5, y: 1 };
                    texture.offset = { x: 0.5, y: 0 };
                    //Update Texture
                    leye.getObject3D("mesh").material.map = texture;
                    leye.getObject3D("mesh").material.map.needsUpdate = true;
                },
                error => {
                    //Error CallBack
                    console.log("An error happened for left image" + error);
                }
            );
            textureLoader.load(stereoImage.getAttribute('src'),
                texture => {
                    texture.repeat = { x: 0.5, y: 1 };
                    //Update Texture
                    reye.getObject3D("mesh").material.map = texture;
                    reye.getObject3D("mesh").material.map.needsUpdate = true;
                },
                error => {
                    //Error CallBack
                    console.log("An error happened for right image" + error);
                }
            );
            aspect = stereoImage.getAttribute('aspect');
            if (aspect != undefined && aspect != null) {
                leye.setAttribute("scale", {x: aspect});
                reye.setAttribute("scale", {x: aspect});
            }
            setStereoImageVisibility(true);
            Utils.setVisibleOnEntityNodelist($descriptionText, true);
            Utils.setVisibleOnEntityNodelist($imageLoading, false);
            Utils.setVisibleOnEntityNodelist($imageLoadError, false);
            Controller.isLoadingStereoImage = false;

            if(!Controller.isInVR && Controller.shouldEnterVR) Controller.enterVR();
        }
    };

    const onImageLoadError = function (){
        unloadStereoImage();
        Utils.setVisibleOnEntityNodelist($descriptionText, false);
        Utils.setVisibleOnEntityNodelist($imageLoading, false);
        Utils.setVisibleOnEntityNodelist($imageLoadError, true);

        if(!Controller.isInVR && Controller.shouldEnterVR) Controller.enterVR();
    };

    /*********************
     * Public functions
     *********************/

    /**
     * Called once when component is attached.
     * Generally for initial setup.
     * @override
     */
    Controller.init = function() {
        galleryController = this;
        try {
            navigator.xr.isSessionSupported('immersive-vr').then(onIsSessionSupported);
        } catch (err) {
            onIsSessionSupported(false);
        }
    }

    /**
     * Called when a component is removed (e.g., via removeAttribute).
     * Generally undoes all modifications to the entity.
     * @override
     */
    Controller.remove = function () {
        sceneEl.removeEventListener('enter-vr', Controller.onEnterVR, false);
        sceneEl.removeEventListener('exit-vr', Controller.onExitVR, false);
    };

    /*
     * Called when entering VR mode
     */
    Controller.onEnterVR = function(event){
        Controller.isInVR = true;
        $mask.removeClass('hidden');
        $scene.removeClass('hidden');
    };

    /*
     * Called when exiting VR mode
     */
    Controller.onExitVR = function (event) {
        Controller.isInVR = false;
        unloadStereoImage();
        $scene.addClass('hidden');
        $mask.addClass('hidden');
    };

    /*
     * We can set the aspect ratio ones with this function
     * or for each image separately by passing the ratio to showImg
     */
    Controller.setAspect = function (aspect) {
        leye.setAttribute("scale", {x: aspect});
        reye.setAttribute("scale", {x: aspect});
    };

    Controller.showImg = function(url, description, aspect){
        Utils.setVisibleOnEntityNodelist($descriptionText, false);
        Utils.setVisibleOnEntityNodelist($imageLoading, true);
        Utils.setVisibleOnEntityNodelist($imageLoadError, false);
        if(!Controller.isInVR) Controller.enterVR();

        unloadStereoImage();
        loadStereoImage(stereoImageId, url, description, aspect);

        descriptionText.setAttribute("text", "value", description);
        Controller.isLoadingStereoImage = true;
    };

    Controller.enterVR = function(){
        Controller.shouldEnterVR = true;
        sceneEl.enterVR();
    };

    Controller.exitVR = function(){
        Controller.shouldEnterVR = false;
        sceneEl.exitVR();
    };

    Controller.moveUiFurtherAway = function(){
        $sceneEntities.each((i, entity) => {
            let position = entity.getAttribute('position');
            if(position.z <= maxUiZDistance) return;
            position.z -= uiZDistanceStep;
            entity.setAttribute('position', position);
        });
    };

    Controller.moveUiCloser = function(){
        $sceneEntities.each((i, entity) => {
            let position = entity.getAttribute('position');
            if(position.z >= minUiZDistance) return;
            position.z += uiZDistanceStep;
            entity.setAttribute('position', position);
        });
    };

    namespace('Components.GalleryController', Controller);
    return Controller;
})());
