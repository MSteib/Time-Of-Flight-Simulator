class schObj {

 

  constructor(name, id, x, y, width, height) {
    this.height = height;
    this.width = width;
    this.name = name;
    this.id = id;
    this.x = x;
    this.y = y;
    this.img = new Image();
  }

  set_svg(img_src) {
    this.img.src = img_src;
  }


  draw_image_internal(ctx_ref, img_ref, x_ref, y_ref, width_ref, height_ref){
    this.img.onload = function() {
      ctx_ref.drawImage(img_ref, x_ref, y_ref, width_ref, height_ref);
    }
  }

  draw_image(ctx_ref){
    this.draw_image_internal(ctx_ref, this.img, this.x, this.y, this.width, this.height)
  }



}
