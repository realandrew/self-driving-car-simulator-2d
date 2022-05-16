class Controls {
  constructor(type) {
    this.forward = false;
    this.left = false;
    this.right = false;
    this.reverse = false;

    switch (type) {
      case ControlType.KEYBOARD:
        this.#addKeyboardListeners();
        break;
      default:
      case ControlType.DUMMY:
        this.forward = true;
        break;
    }
  }

  #addKeyboardListeners() {
    this.keyMap = {
      'w': 'forward',
      'ArrowUp': 'forward',
      'a': 'left',
      'ArrowLeft': 'left',
      'd': 'right',
      'ArrowRight': 'right',
      's': 'reverse',
      'ArrowDown': 'reverse'
    };

    document.onkeydown = (event) => {
      const key = event.key;
      if (key in this.keyMap) {
        this[this.keyMap[key]] = true;
      }
      // console.table(this);
    }

    document.onkeyup = (event) => {
      const key = event.key;
      if (key in this.keyMap) {
        this[this.keyMap[key]] = false;
      }
      // console.table(this);
    }
  }
}