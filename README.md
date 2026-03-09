# The Viscosity of Data

What is a live, moving dataset? 

What if datasets can be more than data that sits? 

What if we imagined them as matter with physical properties? Transforming from one state to another? 

Viscosity of Data is an interactive art and research project exploring the materiality of machine learning datasets. The work emerges from the development of Squiggly, a spatial drawing application built for Apple Vision Pro that connects physical Crayola crayons and crayon boxes to immersive 3D drawing through computer vision.

This repository contains the Three.js environment that reconstructs and visualizes a 3D dataset generated from that system.

https://github.com/user-attachments/assets/f519d097-503d-4b97-aa61-7fc4d972e88c

<img width="1402" height="768" alt="Screenshot 2026-03-09 at 1 55 40 AM" src="https://github.com/user-attachments/assets/75ee46ca-ab45-4899-bb25-793814046517" />

![strokeclassify7](https://github.com/user-attachments/assets/3f634cfb-2627-4a37-835e-24ab5708cd25)



## Project Background
Squiggly translates physical drawing into spatial digital marks using:

 * Object detection (crayon boxes and crayons)
 * Hand gesture recognition and tracking
 * Image and color classification
 * These computer vision systems were implemented without relying on the Apple Vision Pro live camera APIs.

While building Squiggly, a 3D dataset was generated consisting of simple symbols such as numbers, stars, and hearts. Each drawing was saved as:
 * 360-degree image snapshots
 * JSON files containing structured stroke data including coordinate paths and start and end points

## Concept
The Viscosity of Data asks:
  * What are the physical properties of datasets?
  * Can machine learning data exist in multiple equally valid states?
  * What happens when creative gestures become training infrastructure?

Using the archived 360-degree images and JSON stroke files, this project reconstructs the dataset inside an immersive Three.js environment. The coordinate systems extracted from the Vision Pro are rendered in 3D and replayed with their original stroke styles.
The melting in this work is not only visual liquefaction but also structural transformation. 

## Technical Implementation

  * Dataset: 3D spatial drawings (numbers, stars, hearts)
  * Data format: 360 image sequences and JSON stroke files
  * Rendering: Three.js WebGL environment
  * Source pipeline: Apple Vision Pro + custom computer vision system
  * Potential downstream application: Vision Language Action model training

## Resources 
  * Squiggly App: https://github.com/debbieyuen/spatialui
  * Hugging Face dataset: https://huggingface.co/datasets/debbieyuen/squigglydataset
  * Hugging Face ML model: https://huggingface.co/debbieyuen/makerspace
  * Website: https://theapplevisionpro.vercel.app/
  * Squiggly App Demo: https://www.youtube.com/watch?v=R19fWD-zwXY&t=48s
  * Drawing Demo: https://www.youtube.com/watch?v=ldZTil_zFnY&t=4s 

## Requirements
  * Three.js
  * JSON files
  * 360-degree snapshots of drawings
  * Hugging Face 

## Acknowledgements 
This project was created by Deborah Yuen at the University of Southern California

