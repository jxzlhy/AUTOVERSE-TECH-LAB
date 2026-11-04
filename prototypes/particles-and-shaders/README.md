# particles-and-shaders — 能量空间：Shader / GPU 粒子 / 传送门

> 状态：**planned**（阶段三执行——对应 THE NEXUS 能量空间视觉）

## 目标

验证 AUTOVERSE"能量空间"所需的三类视觉技术：TSL/ShaderMaterial 自定义材质、GPU 粒子系统、传送门式场景过渡。

## 验收标准（先行定义）

1. 粒子：同一粒子数（10k/50k/200k）下对比 Points+ShaderMaterial、InstancedMesh、GPGPU 三种实现 FPS 与内存，输出档位表；
2. 传送门：render target 着色器混合转场（参照研究结论：单 renderer + RT 混合为业界主流）实现 THE NEXUS↔展馆 的过渡样例；
3. TSL 试点：至少一个材质用 TSL 编写并在 WebGLRenderer 下验证（WebGPURenderer 行为另测）；
4. 全部效果在 WebGL2 基线浏览器可用，WebGPU 下行为记录差异。

## 依赖

- docs/03-technology/visual-techniques.md（TSL/WebGPU/粒子研究）
- gsap-motion 原型的镜头控制结论（转场与镜头耦合）
