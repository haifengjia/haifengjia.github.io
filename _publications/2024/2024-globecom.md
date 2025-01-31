---
title:          "Neural Reflectance Fields for Radio-Frequency Ray Tracing"
date:           2024/12/08
selected:       true
pub:            "IEEE Global Communications Conference (GLOBECOM)"
pub_date:       "2024"
abstract: >-
  Ray tracing is widely employed to model the propagation of radio-frequency (RF) signal in complex environment. The modelling performance greatly depends on how accurately the target scene can be depicted, including the scene geometry and surface material properties. The advances in computer vision and LiDAR make scene geometry estimation increasingly accurate, but there still lacks scalable and efficient approaches to estimate the material reflectivity in real-world environment. In this work, we tackle this problem by learning the material reflectivity efficiently from the path loss of the RF signal from the transmitters to receivers. Specifically, we want the learned material reflection coefficients to minimize the gap between the predicted and measured powers of the receivers. We achieve this by translating the neural reflectance field from optics to RF domain by modelling both the amplitude and phase of RF signals to account for the multipath effects. We further propose a differentiable RF ray tracing framework that optimizes the neural reflectance field to match the signal strength measurements. We simulate a complex real-world environment for experiments and our simulation results show that the neural reflectance field can successfully learn the reflection coefficients for all incident angles. As a result, our approach achieves better accuracy in predicting the powers of receivers with significantly less training data compared to existing approaches.
cover: /assets/images/covers/ray_tracing.png
authors:
  - Haifeng Jia
  - Xinyi Chen
  - Yichen Wei
  - Yifei Sun
  - Yibo Pi#
links:
  arXiv: https://arxiv.org/abs/2501.02458
  Slides: assets/slides/globecom24_haifeng.pptx
---