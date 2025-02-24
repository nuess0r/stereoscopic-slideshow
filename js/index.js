/* global AFRAME, Components */
(function (){

    /*********************
     * Internal properties
     *********************/
    const THUMBNAIL_WIDTH_PX = 450;
    const ASPECT_RATIO = 0.75;
    const IMG_SERVER = "https://www.iwalkcornwall.co.uk";
    const THUMBNAIL_URL_TEMPLATE = IMG_SERVER+"/images/photos/stereoscopic/{name}.jps/width/"+THUMBNAIL_WIDTH_PX;
    const FULLSIZE_URL_TEMPLATE = IMG_SERVER+"/images/photos/stereoscopic/{name}.jps";

    const ASSETS_PATH = './assets/';
    const IMG_LIST_URL = ASSETS_PATH + 'image_list.json';

    const buttonHoverZoomScale = 0.5;

    const requiredNamespaces = [
        'Components.Utils',
        'Components.GalleryController',
        'Components.Controls'
    ];

    const supportedControllers = [
        "OculusTouch",
        "Daydream",
        "GearVr",
        "MagicLeap",
        "OculusGo",
        "Vive",
        "ViveFocus",
        "WindowsMotion"
    ];

    const controllerHelpText = {
        OculusTouch: {
            title: "Oculus Touch controls",
            text: "Thumbstick left/right to change slide" +
                "\nThumbstick up/down to change viewing distance" +
                "\nA/B/X/Y button to exit VR"
        },
        Daydream: {
            title: "Daydream controls",
            text: "Left/right trackpad to change slide"
        },
        GearVr: {
            title: "Gear VR controls",
            text: "Left/right trackpad to change slide"
        },
        MagicLeap: {
            title: "Magic Leap controls",
            text: "Touchpad left/right to change slide" +
                "\nTouchpad up/down to change viewing distance" +
                "\nMenu button to exit VR"
        },
        OculusGo: {
            title: "Oculus Go controls",
            text: "Touchpad left/right to change slide" +
                "\nTouchpad up/down to change viewing distance"
        },
        Vive: {
            title: "Vive controls",
            text: "Left/right trackpad to change slide" +
                "\nMenu/system button to exit VR"
        },
        ViveFocus: {
            title: "Vive Focus controls",
            text: "Trackpad left/right to change slide" +
                "\nTrackpad up/down to change viewing distance"
        },
        WindowsMotion: {
            title: "Windows Motion controls",
            text: "Trackpad/thumbstick left/right to change slide" +
                "\nTrackpad/thumbstick up/down to change viewing distance" +
                "\nMenu button to exit VR"
        }
    };

    let $imageContainer, $images, $currentImage,
        Utils, GalleryController, Controls,
        Controllers = {};

    /*********************
     * Internal functions
     *********************/
    let _constructor = function(){
        $(document).ready(onDocumentReady);
    };

    let onDocumentReady = function(){
        let namespaces = requiredNamespaces;
        supportedControllers.forEach((controllerName) => {
            namespaces.push(controllerName+'Controls');
        });

        onNamespacesLoaded([
            'Components.Utils',
            'Components.GalleryController',
            'Components.Controls'
        ], function(){
            Utils = Components.Utils;
            GalleryController = Components.GalleryController;
            Controls = Components.Controls;

            supportedControllers.forEach((controllerName) => {
                Controllers[controllerName] = Components[controllerName+'Controls'];
            });

            onLoadedNamespaces();
        });
    }

    let onLoadedNamespaces = function(){
        document.addEventListener(Controls.webXrControllerEventName, onWebXrController);
        $imageContainer = $('#ui .images');

        tinykeys(window, {
            "Space": () => {if(GalleryController.isInVR) showNextImage()},
            "ArrowRight": () => {if(GalleryController.isInVR) showNextImage()},
            "ArrowLeft": () => {if(GalleryController.isInVR) showPrevImage()},
        })

        const $clickableButtons = $('[data-clickable][data-button]');
        Utils.addEventListenerToEntityNodeList($clickableButtons, 'mouseenter', (evt) => {
            const entity = evt.target;
            let scale = entity.getAttribute('scale');
            scale.x += buttonHoverZoomScale;
            scale.y += buttonHoverZoomScale;
            scale.z += buttonHoverZoomScale;
            entity.setAttribute('scale', scale);
        });

        Utils.addEventListenerToEntityNodeList($clickableButtons, 'mouseleave', (evt) => {
            const entity = evt.target;
            let scale = entity.getAttribute('scale');
            scale.x -= buttonHoverZoomScale;
            scale.y -= buttonHoverZoomScale;
            scale.z -= buttonHoverZoomScale;
            entity.setAttribute('scale', scale);
        });

        Utils.addEventListenerToEntityNodeList($('#previous-button'), 'click', showPrevImage);
        Utils.addEventListenerToEntityNodeList($('#next-button'), 'click', showNextImage);
        Utils.addEventListenerToEntityNodeList($('#exit-button'), 'click', exitVR);
        Utils.addEventListenerToEntityNodeList($('#increase-distance-button'), 'click', GalleryController.moveUiFurtherAway);
        Utils.addEventListenerToEntityNodeList($('#decrease-distance-button'), 'click', GalleryController.moveUiCloser);

        $imageContainer.on('click', '.image', onClickImg);
        $.getJSON(IMG_LIST_URL, onLoadImgList);
    };

    let onLoadImgList = function(imgList){
        imgList.forEach(function(img, i){
            const src = THUMBNAIL_URL_TEMPLATE.replace('{name}', img.name),
                description = img.description;
            $imageContainer.append(
                `<span class="image">
                            <img data-src="${img.src}" src="${img.thumbnail}" alt="${img.description}"/>
                        </span>`
            );
        });
    };

    let onClickImg = function(){
        $currentImage = $(this);
        showImg($currentImage.children('img'));
    }

    let showImg = function($img){
        GalleryController.showImg($img.data('src'), $img.attr('alt'), ASPECT_RATIO);
    };

    let onWebXrController = function(event){

        const detail = event.detail,
            controllerType = detail.controllerType,
            control = detail.control,
            hand = detail.hand,
            action = detail.action;


        // Control presses
        if(action === Controls.actions.down){

            // Exit VR mode
            if(
                (controllerType === Controllers.OculusTouch.CONTROL_NAME && (
                control === Controllers.OculusTouch.controls.abutton
                || control === Controllers.OculusTouch.controls.bbutton
                || control === Controllers.OculusTouch.controls.xbutton
                || control === Controllers.OculusTouch.controls.ybutton)
                )
                || (controllerType === Controllers.MagicLeap.CONTROL_NAME &&
                    control === Controllers.OculusTouch.controls.menu
                )
                || (controllerType === Controllers.Vive.CONTROL_NAME &&
                    (control === Controllers.Vive.controls.menu || control === Controllers.Vive.controls.system)
                )
                || (controllerType === Controllers.WindowsMotion.CONTROL_NAME &&
                    control === Controllers.WindowsMotion.controls.menu
                )
            ){
                exitVR();
            }

            // Next/prev slide
            if((controllerType === Controllers.Daydream.CONTROL_NAME && control === Controllers.Daydream.controls.trackpad)
                || (controllerType === Controllers.GearVr.CONTROL_NAME && control === Controllers.GearVr.controls.trackpad)
                || (controllerType === Controllers.Vive.CONTROL_NAME && control === Controllers.Vive.controls.trackpad)
            ){
                if(hand === Controls.hand.left){
                    showPrevImage();
                }else if(hand === Controls.hand.right){
                    showNextImage();
                }
            }
        }

        // Cursor direction controls
        if(action === Controls.actions.directionchanged &&
            (controllerType === Controllers.OculusTouch.CONTROL_NAME && control === Controllers.OculusTouch.controls.thumbstick)
            ||(controllerType === Controllers.MagicLeap.CONTROL_NAME && control === Controllers.MagicLeap.controls.touchpad)
            ||(controllerType === Controllers.OculusGo.CONTROL_NAME && control === Controllers.OculusGo.controls.touchpad)
            ||(controllerType === Controllers.ViveFocus.CONTROL_NAME && control === Controllers.ViveFocus.controls.trackpad)
            ||(controllerType === Controllers.WindowsMotion.CONTROL_NAME && (
                control === Controllers.WindowsMotion.controls.trackpad || control === Controllers.WindowsMotion.controls.thumbstick
            ))
        ){
            if(detail.direction.x === Controls.direction.left){
                showPrevImage();
            }else if(detail.direction.x === Controls.direction.right){
                showNextImage();
            }else if(detail.direction.y === Controls.direction.up){
                GalleryController.moveUiFurtherAway();
            }else if(detail.direction.y === Controls.direction.down){
                GalleryController.moveUiCloser();
            }
        }
    };

    let exitVR = function(){
        GalleryController.exitVR();
    };

    let showNextImage = function(){
        var $next = $currentImage.next();

       // If there wasn't a next one, go back to the first.
        if( $next.length == 0 ) {
            $next = $currentImage.prevAll().last();
        }
        $currentImage = $next;
        showImg($currentImage.children('img'));
    };

    let showPrevImage = function(){
        var $prev = $currentImage.prev();

       // If there wasn't a previous one, go to the last.
        if( $prev.length == 0 ) {
            $prev = $currentImage.nextAll().last();
        }
        $currentImage = $prev;
        showImg($currentImage.children('img'));
    };

    _constructor();
})();
