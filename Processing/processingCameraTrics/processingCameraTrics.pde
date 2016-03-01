float viewMult;
float yNormalize;

void setup()
{
  fullScreen(P3D);
  viewMult = 4;
  yNormalize = width/height*2;
}

void draw()
{
  background(0); // wipe
  camera(-width/2*viewMult+mouseX*viewMult, -height/2*viewMult*yNormalize+mouseY*viewMult*yNormalize, width, 0, 0, 0,0,1,0); // locX, locY, locZ, targX, targY, targZ
  //translate(width/2,height/2, -100);
  stroke(255);
  strokeWeight(2);
  point(0,0,0);
  noFill();
  box(900);
}