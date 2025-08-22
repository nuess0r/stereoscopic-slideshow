Stereoscopic slideshow
======================

This repo demonstrates how a slideshow can be created to render stereoscopic side-by-side images in 3D using a VR headset.
It uses [A-frame](https://aframe.io/) and specifically [aframe-stereo-component](https://github.com/oscarmarinmiro/aframe-stereo-component) as building blocks.

The Stereoscopic slideshow loads a set of side-by-side crossed-eye images in JPS (JPEG Stereo) format from a web server which are displayed as 2D thumbnails in the page.
Clicking one of the images launches the slideshow in immersive VR using the browser's [WebXR API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API) and displays the selected image in the slideshow UI.

VR headsets with stereo displays will render each half of the side-by-side image to the relevant eye, so it appears to the viewer in stereoscopic 3D.
The slideshow UI has buttons to load the next/previous image in the set and move the UI closer or further away.
The controllers for the various [VR headsets supported by A-frame](https://aframe.io/docs/1.2.0/introduction/vr-headsets-and-webvr-browsers.html#which-vr-headsets-does-a-frame-support) are wired up so they can also be used to operate the slideshow controls.

The slideshow will still work on devices without immersive VR support by the images will be rendered in 2D.

# Demo
You can view the slideshow demo here: https://brain4free.org/stereoscopic-slideshow/


## Screenshots
<img src="screenshots/thumbnails.jpg" />
<img src="screenshots/slideshow.jpg" />

# Credits

This is a fork of the proof-of-concept Stereoscopic slideshow by [Dave Alden](https://github.com/dpa99c/stereoscopic-slideshow).
Thank you Dave for showing the world, that it is is now technically doable without the need of headset specific application development.

# Why a fork?

The original project contains hard coded URLs, assumptions about image aspect ratio, too generic names for styles and classes.
This makes it impossible to integrate that code as is into other websites.

The intention of this fork is to restructure and refactor the code so it then can be used easily by other web developers. Think about it like a 3D version of the well known [Lightbox2](https://lokeshdhakar.com/projects/lightbox2/) script to show 2D images in a nice way.
