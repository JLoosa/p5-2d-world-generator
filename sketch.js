

let canvas_reference
// Set the maximum pixel region generated in frame to n by n
let region_size = 50
// Set the screen resolution
let resolution_x = 1024
let resolution_y = 768
// Determine how many regions we have for rendering
let region_count_x = Math.ceil(resolution_x / region_size) | 0
let region_count_y = Math.ceil(resolution_y / region_size) | 0
let current_region = Number.POSITIVE_INFINITY
let region_count = region_count_x * region_count_y
// Prevent continuous memory reallocation when generating noise values
let noiseVal
// Scale at which the perlin noise function will change
let noiseScale = 0.005
// world rendering fields
let world_height = {"max": 500, "min": -250}
let world_color, color_map
let seed
// User input fields
let seed_input
let enable_color_lerp = false

function setup() {
  // Set the color Mode
  colorMode(HSB)
  // Define any colors we will use
  world_color = {
    "DEEP_SEA": color('#1218c7'),
    "SEA": color('#006691'),
    "SHALLOW_SEA": color('#00c9c3'),
    "BEACH": color('#ffed78'),
    "THICK_GRASS": color('#047d06'),
    "GRASS": color('#36a338'),
    "SPARSE_GRASS": color('#8fbf77'),
    "MOUNTAIN_SIDE": color('#8f8f8f'),
    "MOUNTAIN_PEAK": color('#d9d9d9')
  }
  color_map = [
    "DEEP_SEA",
    "SEA",
    "SHALLOW_SEA",
    "BEACH",
    "THICK_GRASS",
    "GRASS",
    "SPARSE_GRASS",
    "MOUNTAIN_SIDE",
    "MOUNTAIN_PEAK"
  ]
  // Create the canvas
  canvas_reference = createCanvas(resolution_x, resolution_y)
  console.log("Total regions:", region_count)
  // Create save button
  buttonSave = createButton("Save Map Image")
  buttonSave.mousePressed(save_image)
  // Create seed box
  seed = (random() * 1e6)|0
  seed_input = createInput("" + seed, "Seed")
  seed_input.input(() => {
    console.log("Seed input received:", seed_input.value())
    seed = parseFloat(seed_input.value())
    console.log("Seed set to:", noiseScale)
  })
  // Create scale box
  scaleInput = createInput("" + noiseScale, "Scale")
  scaleInput.input(() => {
    console.log("Scale input received:", scaleInput.value())
    noiseScale = parseFloat(scaleInput.value())
    console.log("Scale set to:", noiseScale)
  })
  // Create lerp button
  buttonRedraw = createButton("Toggle Blending")
  buttonRedraw.mousePressed(() => {
    enable_color_lerp = !enable_color_lerp
    console.log("Blending set to", enable_color_lerp)
  })
  // Create redraw button
  buttonRedraw = createButton("Re-draw Map")
  buttonRedraw.mousePressed(configForRedraw)

  configForRedraw()
}

function clamp(value, min, max) {
  if (value > max)
    return max
  if (value < min)
    return min
  return value
}

function getAltitudeColor(altitude) {
  scaled_value = map(altitude, world_height.min, world_height.max, 0, color_map.length-1)
  let useLerp = enable_color_lerp&(scaled_value>0)&(scaled_value<color_map.length-1)
  color_index = clamp(scaled_value, 0, color_map.length-1) | 0
  if (!useLerp)
    return world_color[color_map[color_index]]
  else
    return lerpColor(world_color[color_map[color_index]], world_color[color_map[color_index+1]],scaled_value-color_index)
}

function getRegionBoundsX(region_number) {
  // Region numbering is row-major, so we can determine the column by applying %
  let region_x = region_number % region_count_x
  // Return it as a dictionary so we can us lookup
  return {
    "start":region_size * (region_x),
    "end": region_size * (region_x +1)
  }
}

function getRegionBoundsY(region_number) {
  // Region numbering is row-major, so we can determine the row by dividing then flooring
  let region_y = Math.floor(region_number / region_count_x)
  // Return it as a dictionary so we can us lookup
  return {
    "start":region_size * (region_y),
    "end": region_size * (region_y+1)
  }
}

function save_image() {
  if (isLooping())
    return
  saveCanvas(canvas_reference, "WorldImage", "jpg")
}

function draw() {
  // Only make the background black if we have not drawn any regions yet
  if (current_region ===0)
    background(0);
  // If we have draw everything, stop looping
  if (current_region > region_count) {
    noLoop()
    return;
  }
  // Get the bounds of the region we are drawing
  let xb = getRegionBoundsX(current_region)
  let yb = getRegionBoundsY(current_region)
  // Iterate over the region
  for (let x = xb.start; x < xb.end; x++) {
    for (let y = yb.start; y < yb.end; y++) {
      noiseVal = map(noise(x*noiseScale, y*noiseScale), 0, 1, world_height.min, world_height.max)
      stroke(getAltitudeColor(noiseVal))
      point(x, y)
    }
  }
  // If we are done drawing the final region,
  // we need to insert lines separating the segments
  if (current_region === region_count) {
    /// Vertical dividers
    for (let x = 0; x < region_count_x; x++) {
      stroke(0)
      strokeWeight(0.25)
      line (x*region_size, 0, x*region_size, height)
    }
    /// Horizontal dividers
    for (let y = 0; y < region_count_y; y++) {
      stroke(0)
      strokeWeight(0.25)
      line (0, y*region_size, width, y*region_size)
    }
  }
  current_region++
}

function configForRedraw() {
  noiseDetail(8, .35)
  noiseSeed(seed)
  current_region = 0
  loop()
}


