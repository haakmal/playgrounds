const STORAGE_KEY = 'interactive-prototyping-companion-v5';

const sectionNames = {
  explore: 'Explore',
  define: 'Define',
  make: 'Make',
  test: 'Test',
  reflect: 'Reflect',
  reports: 'Reports'
};

const processPatterns = {
  Trigger: {
    summary: 'One event causes one response.',
    hint: 'Example: press Button A → turn the lights on.',
    blocks: ['WHEN {input} happens', 'DO {output}'],
    library: 'trigger'
  },
  Toggle: {
    summary: 'Each input switches between two states.',
    hint: 'Example: press once → lights on; press again → lights off.',
    blocks: [
      'WHEN {input} happens',
      'CHANGE current state',
      'IF on → turn {output} off',
      'IF off → turn {output} on'
    ],
    library: 'toggle'
  },
  Threshold: {
    summary: 'A changing value is compared with a point before responding.',
    hint: 'Example: if the light level is low → turn the LEDs on.',
    blocks: ['READ {input} value', 'IF value crosses threshold', 'DO {output}'],
    library: 'threshold'
  },
  Delay: {
    summary: 'The prototype waits before the next response.',
    hint: 'Example: press → wait one second → play the sound.',
    blocks: ['WHEN {input} happens', 'WAIT for a chosen time', 'DO {output}'],
    library: 'delay'
  },
  Sequence: {
    summary: 'Responses happen in a deliberate order.',
    hint: 'Example: press → light → wait → sound.',
    blocks: ['WHEN {input} happens', 'DO {output}', 'THEN continue to next response'],
    library: 'sequence'
  },
  Repeat: {
    summary: 'A response continues or happens again.',
    hint: 'Example: touch → repeatedly pulse the LEDs until the state changes.',
    blocks: ['WHEN {input} happens', 'REPEAT', 'DO {output}'],
    library: 'repeat'
  }
};

const libraryEntries = [
  {
    id: 'touch',
    group: 'SENSE',
    title: 'Capacitive touch',
    lead: 'Sense a person touching a conductive surface.',
    body: 'Circuit Playground Express provides capacitive-touch pads, so touch can be explored without adding a separate sensor. Touch is useful for prototypes where the material or surface itself becomes the control.',
    ipo: 'INPUT · Touch',
    cpx: 'Try pads A1–A7 with MakeCode input events.',
    links: [
      ['Adafruit · Capacitive Touch', 'https://learn.adafruit.com/sensors-in-makecode/capacitive-touch'],
      ['Adafruit · Make It Sense', 'https://learn.adafruit.com/make-it-sense/using-capacitive-touch'],
      ['ESP32 · Touch API', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/touch.html']
    ]
  },
  {
    id: 'button',
    group: 'SENSE',
    title: 'Buttons and switches',
    lead: 'Sense a discrete press or switch position.',
    body: 'Buttons are useful when the interaction has a clear physical action. They are also one of the simplest ways to separate a user action from the prototype response.',
    ipo: 'INPUT · Pressure',
    cpx: 'Circuit Playground has Button A, Button B and a slide switch.',
    links: [
      ['Adafruit · Onboard switches', 'https://learn.adafruit.com/make-it-sense/makecode'],
      ['Arduino · Language Reference', 'https://docs.arduino.cc/language-reference/'],
      ['ESP32 · GPIO API', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/gpio.html']
    ]
  },
  {
    id: 'movement',
    group: 'SENSE',
    title: 'Movement and orientation',
    lead: 'Sense shaking, movement, tilt or orientation.',
    body: 'An accelerometer measures acceleration. This lets a prototype respond to gestures such as shaking as well as its orientation relative to gravity.',
    ipo: 'INPUT · Movement / Tilt',
    cpx: 'Use MakeCode gesture events or live accelerometer values.',
    links: [
      ['Adafruit · Sensors in MakeCode', 'https://learn.adafruit.com/sensors-in-makecode'],
      ['MakeCode · Input reference', 'https://makecode.adafruit.com/reference/input']
    ]
  },
  {
    id: 'light-sense',
    group: 'SENSE',
    title: 'Light level',
    lead: 'Sense changes in ambient brightness.',
    body: 'Light sensing is useful when the environment itself should influence an interaction. Relative values are often more useful for prototyping than trying to measure an exact physical quantity.',
    ipo: 'INPUT · Light',
    cpx: 'Read the built-in light sensor and compare values.',
    links: [
      ['Adafruit · Light sensor', 'https://learn.adafruit.com/make-it-sense/use-the-light-sensor'],
      ['MakeCode · Input reference', 'https://makecode.adafruit.com/reference/input'],
      ['ESP32 · ADC API', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html']
    ]
  },
  {
    id: 'sound-sense',
    group: 'SENSE',
    title: 'Sound level',
    lead: 'Sense loudness in the environment.',
    body: 'The microphone can be used as an input for loudness or sound events. For novice prototypes, treat it as a level or event rather than attempting detailed audio recognition.',
    ipo: 'INPUT · Sound',
    cpx: 'Use loud-sound events or sound-level values in MakeCode.',
    links: [
      ['Adafruit · Sensors in MakeCode', 'https://learn.adafruit.com/sensors-in-makecode'],
      ['MakeCode · Input reference', 'https://makecode.adafruit.com/reference/input']
    ]
  },
  {
    id: 'trigger',
    group: 'PROCESS',
    title: 'Trigger',
    lead: 'One event causes one response.',
    body: 'A trigger is the simplest process pattern. Something is detected and the prototype responds. Start here when you need to prove that an input and output work together.',
    ipo: 'PROCESS · Event → response',
    cpx: 'Example: press Button A → set LEDs blue.',
    links: [
      ['MakeCode · Input reference', 'https://makecode.adafruit.com/reference/input'],
      ['Arduino · Language Reference', 'https://docs.arduino.cc/language-reference/']
    ]
  },
  {
    id: 'toggle',
    group: 'PROCESS',
    title: 'Toggle',
    lead: 'Switch between two states.',
    body: 'A toggle remembers whether something is currently on or off, selected or unselected, and changes that state each time the input occurs.',
    ipo: 'PROCESS · State change',
    cpx: 'Example: press once → lights on; press again → lights off.',
    links: [
      ['MakeCode · Reference', 'https://makecode.adafruit.com/reference'],
      ['Arduino · Language Reference', 'https://docs.arduino.cc/language-reference/']
    ]
  },
  {
    id: 'threshold',
    group: 'PROCESS',
    title: 'Threshold',
    lead: 'Respond when a changing value crosses a point.',
    body: 'Thresholds turn continuous sensor readings into decisions. They are useful for light, sound, temperature and other values that vary rather than simply being on or off.',
    ipo: 'PROCESS · Compare value → decide',
    cpx: 'Example: if light level is below a chosen value → turn LEDs on.',
    links: [
      ['Adafruit · Sensors in MakeCode', 'https://learn.adafruit.com/sensors-in-makecode'],
      ['ESP32 · ADC API', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html']
    ]
  },
  {
    id: 'delay',
    group: 'PROCESS',
    title: 'Delay',
    lead: 'Wait before the next response.',
    body: 'A delay changes timing rather than the input or output. Timing can strongly affect how an interaction feels, but long blocking delays can also make a prototype unresponsive.',
    ipo: 'PROCESS · Event → wait → response',
    cpx: 'Example: press → wait one second → play sound.',
    links: [
      ['MakeCode · Reference', 'https://makecode.adafruit.com/reference'],
      ['Arduino · Language Reference', 'https://docs.arduino.cc/language-reference/']
    ]
  },
  {
    id: 'sequence',
    group: 'PROCESS',
    title: 'Sequence',
    lead: 'Arrange responses in a deliberate order.',
    body: 'A sequence lets an interaction unfold over time. Use it when the order of responses matters rather than everything happening simultaneously.',
    ipo: 'PROCESS · Response A → Response B',
    cpx: 'Example: press → light → wait → sound.',
    links: [['MakeCode · Reference', 'https://makecode.adafruit.com/reference']]
  },
  {
    id: 'repeat',
    group: 'PROCESS',
    title: 'Repeat',
    lead: 'Continue or repeat a response.',
    body: 'Repeating behaviour can create pulsing, blinking, alarms and ongoing feedback. Always consider how the repeated behaviour stops.',
    ipo: 'PROCESS · Repeat until changed',
    cpx: 'Example: touch → repeatedly pulse the LEDs.',
    links: [['MakeCode · Reference', 'https://makecode.adafruit.com/reference']]
  },
  {
    id: 'state',
    group: 'PROCESS',
    title: 'State',
    lead: 'Remember what mode the prototype is currently in.',
    body: 'State becomes useful when the same input should do different things depending on what happened previously. Toggle is a simple two-state example.',
    ipo: 'PROCESS · Remember → respond',
    cpx: 'Use a variable to remember the current mode.',
    links: [['MakeCode · Reference', 'https://makecode.adafruit.com/reference']]
  },
  {
    id: 'light-output',
    group: 'RESPOND',
    title: 'Light and colour',
    lead: 'Use visible feedback to communicate state or change.',
    body: 'Circuit Playground has addressable NeoPixels. Light can communicate confirmation, warning, status, direction, rhythm or atmosphere—not simply decoration.',
    ipo: 'OUTPUT · Light / colour',
    cpx: 'Start with one colour or brightness change before creating animations.',
    links: [
      ['Adafruit · Circuit Playground Express', 'https://learn.adafruit.com/adafruit-circuit-playground-express/'],
      ['MakeCode · Reference', 'https://makecode.adafruit.com/reference']
    ]
  },
  {
    id: 'sound-output',
    group: 'RESPOND',
    title: 'Sound',
    lead: 'Use audible feedback as an output.',
    body: 'Sound can confirm an action, signal a state or create character. Consider duration, repetition and whether the sound remains understandable in the intended environment.',
    ipo: 'OUTPUT · Sound',
    cpx: 'Use the built-in speaker for tones and simple audio feedback.',
    links: [['Adafruit · Circuit Playground Express', 'https://learn.adafruit.com/adafruit-circuit-playground-express/']]
  },
  {
    id: 'animation-output',
    group: 'RESPOND',
    title: 'Animation and change over time',
    lead: 'Use several visual states as a temporal response.',
    body: 'An animation is multiple outputs arranged over time. Keep the first version short enough that you can understand which step is responsible for the behaviour you observe.',
    ipo: 'OUTPUT · Visual sequence',
    cpx: 'Combine LED changes with short waits.',
    links: [['MakeCode · Reference', 'https://makecode.adafruit.com/reference']]
  },
  {
    id: 'beyond',
    group: 'EXTEND',
    title: 'Beyond Circuit Playground',
    lead: 'Carry the interaction model to other microcontrollers.',
    body: 'Circuit Playground reduces setup friction by integrating sensors and outputs. Arduino, ESP32 and Pico expose more general-purpose pins and peripherals, so you gain flexibility but also take on wiring, pin selection, libraries and power considerations. Move outward when your project needs something the current platform cannot provide, and seek technical advice before committing hardware.',
    ipo: 'The IPO model transfers; implementation changes.',
    cpx: 'Treat Circuit Playground as a scaffold, not a limitation.',
    links: [
      ['Arduino · Language Reference', 'https://docs.arduino.cc/language-reference/'],
      ['ESP32 · Arduino libraries', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/libraries.html'],
      ['ESP32 · GPIO API', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/gpio.html'],
      ['Raspberry Pi · Microcontrollers', 'https://www.raspberrypi.com/documentation/microcontrollers/'],
      ['Raspberry Pi Pico · MicroPython', 'https://www.raspberrypi.com/documentation/microcontrollers/micropython.html'],
      ['Raspberry Pi Pico · Hardware APIs', 'https://www.raspberrypi.com/documentation/pico-sdk/hardware.html']
    ]
  }
];

const outputOptions = ['Light', 'Animation', 'Sound', 'State change'];
const processOptions = Object.keys(processPatterns);
