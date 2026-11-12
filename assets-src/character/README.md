# Character source files (not deployed)

- `character.glb`: static 3D model generated from the owner's reference image with
  [TRELLIS](https://github.com/microsoft/TRELLIS) (MIT), via the trellis-community Hugging Face Space.
  Ground plate removed, material set non-metallic.
- `character-for-mixamo.zip`: the same model as OBJ + MTL + PNG texture (175 cm tall, feet at y=0, facing +Z),
  ready for Mixamo's "Upload Character" auto-rigger.

After rigging in Mixamo, download the "Typing" animation as FBX Binary, With Skin, 30 fps, and save it as
`public/assets/3d/character/typing.fbx`. The site uses it automatically instead of the built-in procedural character.
