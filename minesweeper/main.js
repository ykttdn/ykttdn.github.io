const HEIGHT_EASY = 9;
const HEIGHT_NORMAL = 16;
const HEIGHT_HARD = 16;
const WIDTH_EASY = 9;
const WIDTH_NORMAL = 16;
const WIDTH_HARD = 30;
const MINES_EASY = 10;
const MINES_NORMAL = 40;
const MINES_HARD = 99;

let height = HEIGHT_EASY;
let width = WIDTH_EASY;
let mines = MINES_EASY;

let hasGameStarted = false;
let hasOpenedMinedCell = false;
let hasOpenedAllSafeCells = false;
let safeCellCount = height*width-mines;
let remainingMines = mines;

const remains = document.getElementsByClassName('remains')[0];
const setMineCounter = () => {
  if (remainingMines <= -100) {
    remains.textContent = `-99`;
  } else if (remainingMines <= -10) {
    remains.textContent = remainingMines;
  } else if (remainingMines <= -1) {
    remains.textContent = `- ${-remainingMines}`;
  } else if (remainingMines <= 9) {
    remains.textContent = `00${remainingMines}`;
  } else if (remainingMines <= 99) {
    remains.textContent = `0${remainingMines}`;
  } else if (remainingMines <= 999) {
    remains.textContent = remainingMines;
  } else {
    remains.textContent = `999`;
  }
}
setMineCounter();


const timer = document.getElementsByClassName('timer')[0];
let intervalId;
const advanceTimer = () => {
  let now = strToInt(timer.textContent);
  now++;
  if (now < 10) {
    timer.textContent = `00${now}`;
  } else if (now < 100) {
    timer.textContent = `0${now}`;
  } else if (now < 1000) {
    timer.textContent = `${now}`;
  } else {
    stopTimer();
  }
}
const stopTimer = () => {
  clearInterval(intervalId);
  intervalId = null;
}

class Cell {
  constructor() {
    this.isMineHiddenIn = false;
    this.isOpened = false;
    this.isFlagged = false;
  }
}
let cells = JSON.parse(JSON.stringify((new Array(height)).fill((new Array(width)).fill(new Cell()))));

const initializeGame = () => {
  cells = JSON.parse(JSON.stringify((new Array(height)).fill((new Array(width)).fill(new Cell()))));

  hasGameStarted = false;
  hasOpenedMinedCell = false;
  hasOpenedAllSafeCells = false;
  safeCellCount = height*width-mines;
  remainingMines = mines;
  setMineCounter();
  changeFaceOfResetButton(FACE_NORMAL);
  timer.textContent = '000';
  stopTimer();

  initializeBoard();
}

const FACE_NORMAL = twemoji.convert.fromCodePoint('1F642');
const FACE_SUCCESS = twemoji.convert.fromCodePoint('1F60E');
const FACE_FAILURE = twemoji.convert.fromCodePoint('1F635');

const resetButton = document.getElementsByClassName('reset-button')[0];
resetButton.addEventListener('click', initializeGame);
const changeFaceOfResetButton = (face) => {
  resetButton.textContent = face;
  twemoji.parse(resetButton, {
    folder: 'svg',
    ext: '.svg'
  });
}
changeFaceOfResetButton(FACE_NORMAL);

const board = document.getElementsByClassName('board')[0];
const documentFragment = document.createDocumentFragment();

const UNOPENED_CELL = 'cell cell--unopened';
const OPENED_CELL = 'cell cell--opened';
const FLAGGED_CELL = 'cell cell--unopened cell--flagged';
const WRONGLY_FLAGGED_CELL = 'cell cell--unopened cell--flagged cell--flagged-wrongly';
const MINED_CELL = 'cell cell--unopened cell--mined';
const EXPLODED_CELL = 'cell cell--exploded';

const strToInt = (str) => parseInt(str, 10);

// 0 以上 val 未満の整数乱数を返す
const random = (val) =>  Math.floor(Math.random()*val);

const initializeMines = e => {
  const cell = e.target;
  const rowTouchedFirst = strToInt(cell.dataset.row);
  const columnTouchedFirst = strToInt(cell.dataset.col);

  if (!hasGameStarted) {
    hasGameStarted = true;
    for (let k = 0; k < mines; k++) {
      while (true) {
        const rowPickedRandomly = random(height);
        const columnPickedRandomly = random(width);
        if (!cells[rowPickedRandomly][columnPickedRandomly].isMineHiddenIn && !(rowTouchedFirst === rowPickedRandomly && columnTouchedFirst === columnPickedRandomly)) {
          cells[rowPickedRandomly][columnPickedRandomly].isMineHiddenIn = true;
          break;
        }
      }

      /*
      let row = random(height);
      let col = random(width);
      if (!cells[row][col].isMineHiddenIn && !(i === row && j === col)) {
        // (row, col)成分に爆弾が埋められていない，かつ，(row, col)成分が最初に開いたcellでないとき
        cells[row][col].isMineHiddenIn = true;
      } else {
        // (row, col)成分に爆弾が埋められている，または，(row,col)成分が最初に開いたcellのとき
        // (row, col)成分の右隣のcellに移動し続け，そこに爆弾がなければ埋める
        while (true) {
          col++;
          if (col === width) {
            col = 0;
            row++;
            if (row === height) {
              row = 0;
            }
          }
          if (!cells[row][col].isMineHiddenIn && !(i === row && j === col)) {
            cells[row][col].isMineHiddenIn = 1;
            break;
          }
        }
      }
      */
    }
  }
}

const openSafeCell = (i, j) => {
  const cell = document.getElementById(`cell-${i}-${j}`);
  cells[i][j].isOpened = true;
  cell.className = OPENED_CELL;

  safeCellCount--;
}

// row 行 col 列のマスの周囲8個のマスの行・列を返す
const getNeighborCellsIndex = (row, col) => {
  return [[row-1, col-1], [row-1, col], [row-1, col+1],
          [row, col-1],                 [row, col+1],
          [row+1, col-1], [row+1, col], [row+1, col+1]];
}

// row 行 col 列の cell が board に含まれているかを判定
const checkIfCellIsInsideBoard = (row, col) => 0 <= row && row < height && 0 <= col && col < width;

const searchMines = (i, j) => {
  let cnt = 0;
  const neighborCells = getNeighborCellsIndex(i, j);

  for (const [row, col] of neighborCells) {
    if (checkIfCellIsInsideBoard(row, col) && cells[row][col].isMineHiddenIn) {
      cnt++;
    }
  }

  if (cnt > 0) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.textContent = cnt;
    cell.classList.add(`cnt-${cnt}`);
  } else if (!hasOpenedMinedCell) {
    for (const [row, col] of neighborCells) {
      if (checkIfCellIsInsideBoard(row, col) && !cells[row][col].isOpened) {
        openSafeCell(row, col);
        searchMines(row, col);
      }
    }
  }
}

const openCell = e => {
  const cell = e.target;
  const i = strToInt(cell.dataset.row);
  const j = strToInt(cell.dataset.col);

  if (!cells[i][j].isOpened && !cells[i][j].isFlagged) {
    if (cells[i][j].isMineHiddenIn) {
      cells[i][j].isOpened = true;
      hasOpenedMinedCell = true;
      cell.className = EXPLODED_CELL;
    } else {
      openSafeCell(i, j);
      searchMines(i, j);
    }
  }
}

const toggleFlag = e => {
  e.preventDefault();

  if (!intervalId) {
    intervalId = setInterval(advanceTimer, 1000);
  }

  const cell = e.target;
  const i = strToInt(cell.dataset.row);
  const j = strToInt(cell.dataset.col);
  if (!cells[i][j].isOpened) {
    if (!cells[i][j].isFlagged) {
      cells[i][j].isFlagged = true;
      cell.className = FLAGGED_CELL;

      remainingMines--;
      setMineCounter();
    } else {
      cells[i][j].isFlagged = false;
      cell.className = UNOPENED_CELL;

      remainingMines++;
      setMineCounter();
    }
  }
}

const exeChording = e => {
  const cell = e.target;
  const i = strToInt(cell.dataset.row);
  const j = strToInt(cell.dataset.col);

  if (cells[i][j].isOpened) {
    const mineCount = strToInt(cell.textContent);

    let flagCount = 0;
    const neighborCells = getNeighborCellsIndex(i, j);

    for (const [row, col] of neighborCells) {
      if (checkIfCellIsInsideBoard(row, col) && cells[row][col].isFlagged) {
        flagCount++;
      }
    }

    if (mineCount === flagCount) {
      let canExeChording = true;
      for (const [row, col] of neighborCells) {
        if (checkIfCellIsInsideBoard(row, col) && cells[row][col].isFlagged && !cells[row][col].isMineHiddenIn) {
          canExeChording = false;
        }
      }

      if (canExeChording) {
        for (const [row, col] of neighborCells) {
          if (checkIfCellIsInsideBoard(row, col) && !cells[row][col].isOpened && !cells[row][col].isFlagged) {
            openSafeCell(row, col);
            searchMines(row, col);
          }
        }
      } else {
        hasOpenedMinedCell = true;
        for (const [row, col] of neighborCells) {
          const c = document.getElementById(`cell-${row}-${col}`);
          if (checkIfCellIsInsideBoard(row, col) && !cells[row][col].isOpened) {
            if (cells[row][col].isFlagged && !cells[row][col].isMineHiddenIn) {
              // cell-${row}-${col}に爆弾がないのにflagが立てられているとき
              c.className = WRONGLY_FLAGGED_CELL;
            } else if (!cells[row][col].isFlagged && cells[row][col].isMineHiddenIn) {
              // cell-${row}-${col}に爆弾があるのにflagが立っていないとき
              c.className = EXPLODED_CELL;
            } else if (!cells[row][col].isFlagged) {
              // cell-${row}-${col}に爆弾がなくてflagも立っていないとき
              openSafeCell(row, col);
              searchMines(row, col);
            }
          }
        }
      }
    }
  }
}

const touchCell = e => {
  if (!hasGameStarted && !isFlagModeOn) {
    initializeMines(e);
    openCell(e);

    if (!intervalId) {
      intervalId = setInterval(advanceTimer, 1000);
    }
  } else {
    const cell = e.target;
    const i = strToInt(cell.dataset.row);
    const j = strToInt(cell.dataset.col);

    if (isFlagModeOn && !cells[i][j].isOpened) {
      toggleFlag(e);
      if (!intervalId) {
        intervalId = setInterval(advanceTimer, 1000);
      }
    } else if (!cells[i][j].isOpened) {
      openCell(e);
    } else {
      exeChording(e);
    }

    if (safeCellCount === 0) {
      hasOpenedAllSafeCells = true;
    }

    if (hasOpenedMinedCell || hasOpenedAllSafeCells) {
      stopTimer();
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const cell = document.getElementById(`cell-${i}-${j}`);
          cell.removeEventListener('click', touchCell);
          cell.removeEventListener('contextmenu', toggleFlag);
        }
      }

      if (hasOpenedMinedCell) {
        changeFaceOfResetButton(FACE_FAILURE);
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (!cells[i][j].isOpened && cells[i][j].isMineHiddenIn && !cells[i][j].isFlagged) {
              const cell = document.getElementById(`cell-${i}-${j}`);
              cell.className = MINED_CELL;
            } else if (!cells[i][j].isOpened && !cells[i][j].isMineHiddenIn && cells[i][j].isFlagged) {
              const cell = document.getElementById(`cell-${i}-${j}`);
              cell.className = WRONGLY_FLAGGED_CELL;
            }
          }
        }
      } else {
        changeFaceOfResetButton(FACE_SUCCESS);
        remainingMines = 0;
        setMineCounter();
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (cells[i][j].isMineHiddenIn && !cells[i][j].isFlagged) {
              const cell = document.getElementById(`cell-${i}-${j}`);
              cell.className = FLAGGED_CELL
            }
          }
        }
      }
    }
  }
}

const initializeBoard = () => {
  while (board.firstChild) {
    board.removeChild(board.firstChild);
  }

  for (let i = 0; i < height; i++) {
    const row = document.createElement('div');
    row.className ='row';
    for (let j = 0; j < width; j++) {
      const cell = document.createElement('div');
  
      const cellID = `cell-${i}-${j}`;
      cell.id = cellID;
  
      cell.className = UNOPENED_CELL;
  
      cell.dataset.row = i;
      cell.dataset.col = j;
  
      cell.addEventListener('click', touchCell);
      cell.addEventListener('contextmenu', toggleFlag);
  
      row.appendChild(cell);
    }
    documentFragment.appendChild(row);
  }
  board.appendChild(documentFragment);
}

initializeBoard();

const switchButton = document.getElementsByClassName('switch')[0];
let isFlagModeOn = false;
switchButton.addEventListener('click', () => {
  isFlagModeOn = switchButton.classList.toggle('switch--on');
});

const selector = document.getElementsByTagName('select')[0];
selector.addEventListener('change', e => {
  const level = e.target.value;
  if (level === 'easy') {
    height = HEIGHT_EASY;
    width = WIDTH_EASY;
    mines = MINES_EASY;
  } else if (level === 'normal') {
    height = HEIGHT_NORMAL;
    width = WIDTH_NORMAL;
    mines = MINES_NORMAL;
  } else {
    height = HEIGHT_HARD;
    width = WIDTH_HARD;
    mines = MINES_HARD;
  }

  initializeGame();
});