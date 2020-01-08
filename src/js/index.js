import { GRID_SIZE, MARGIN } from "./globals";
import { snapToGrid, confirm, uuidv4, getLocalStorageItem, setLocalStorageItem } from "./utils";

import "../sass/index.scss";

let activeMemo;

let main, canvas, board, selection;
let width, height;
let currentMouse, currentSize;

/*
  Generic Event Handlers
*/

function onMouseDown(e) {
  if (e.target === board) {
    handleBoardDragStart(e);
  } else {
    if (e.target.classList[0] === "drag") {
      handleMemoDragStart(e);
    } else if (e.target.classList[0] === "resize") {
      handleMemoResizeStart(e);
    }
  }
};

/*
  Memo Functions and Handlers
*/

function createMemo(id, text, position, size) {
  const memo = document.createElement("div");
  memo.setAttribute("data-id", id);
  memo.classList.add("memo");
  memo.style.top = `${position.top}px`;
  memo.style.left = `${position.left}px`;
  memo.style.width = `${size.width}px`;
  memo.style.height = `${size.height}px`;

  const drag = document.createElement("div");
  drag.classList.add("drag");
  drag.addEventListener("mousedown", onMouseDown, false);
  drag.addEventListener("touchstart", onMouseDown, false);
  memo.appendChild(drag);

  const close = document.createElement("div");
  close.classList.add("close");
  close.innerHTML = "–";
  close.addEventListener("mouseup", handleMemoClose, false);
  close.addEventListener("touchend", handleMemoClose, false);
  memo.appendChild(close);

  const textarea = document.createElement("textarea");
  textarea.classList.add("input");
  textarea.setAttribute("placeholder", "Add a short memo...");
  textarea.setAttribute("autocomplete", false);
  textarea.setAttribute("spellcheck", false);

  if (text) { textarea.value = text; ; }

  textarea.addEventListener("focus", function (e) { e.target.classList.add("active"); }, false);
  textarea.addEventListener("blur", function (e) { e.target.classList.remove("active"); }, false);
  textarea.addEventListener("input", function (e) {
    const memos = getLocalStorageItem("memos");
    memos[id] = { ...memos[id], text: e.target.value };
    setLocalStorageItem("memos", memos);
  }, false);

  memo.appendChild(textarea);

  const resize = document.createElement("div");
  resize.classList.add("resize");
  resize.addEventListener("mousedown", onMouseDown, false);
  resize.addEventListener("touchstart", onMouseDown, false);
  memo.appendChild(resize);

  return memo;
};

function handleMemoDragStart(e) {
  e.preventDefault();

  activeMemo = e.target.parentNode;
  activeMemo.classList.add("active");
  activeMemo.style.zIndex = "99999";

  e.target.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
  e.target.style.cursor = "grabbing";

  document.body.style.cursor = "grabbing";

  const x = snapToGrid(e.clientX, GRID_SIZE);
  const y = snapToGrid(e.clientY, GRID_SIZE);

  currentMouse = { x, y };

  document.addEventListener("mousemove", handleMemoDragMove, false);
  document.addEventListener("touchmove", handleMemoDragMove, false);

  document.addEventListener("mouseup", handleMemoDragEnd, false);
  document.addEventListener("touchcancel", handleMemoDragEnd, false);
  document.addEventListener("touchend", handleMemoDragEnd, false);
};

function handleMemoDragMove(e) {
  e.preventDefault();

  const isActive = activeMemo.classList.contains("active");

  if (isActive) {
    const x = snapToGrid(e.clientX, GRID_SIZE);
    const y = snapToGrid(e.clientY, GRID_SIZE);

    activeMemo.style.top = `${activeMemo.offsetTop - (currentMouse.y - y)}px`;
    activeMemo.style.left = `${activeMemo.offsetLeft - (currentMouse.x - x)}px`;

    currentMouse = { x, y };
  }
};

function handleMemoDragEnd(e) {
  e.preventDefault();

  const x = snapToGrid(e.clientX, GRID_SIZE);
  const y = snapToGrid(e.clientY, GRID_SIZE);

  const top = activeMemo.offsetTop - (currentMouse.y - y);
  const left = activeMemo.offsetLeft - (currentMouse.x - x);

  activeMemo.style.top = `${top}px`;
  activeMemo.style.left = `${left}px`;
  activeMemo.classList.remove("active");

  const drag = activeMemo.querySelectorAll(".drag")[0];
  drag.style.cursor = "grab";
  drag.style.backgroundColor = "transparent";

  const id = activeMemo.dataset.id;
  const memos = getLocalStorageItem("memos");
  memos[id] = { ...memos[id], position: { top, left } };
  setLocalStorageItem("memos", memos);

  document.body.style.cursor = null;
  activeMemo = null;
  currentMouse = null;

  document.removeEventListener("mousemove", handleMemoDragMove, false);
  document.removeEventListener("touchmove", handleMemoDragMove, false);

  document.removeEventListener("mouseup", handleMemoDragEnd, false);
  document.removeEventListener("touchcancel", handleMemoDragEnd, false);
  document.removeEventListener("touchend", handleMemoDragEnd, false);
};

function handleMemoClose(e) {
  if (confirm("Are you sure you want to remove this memo?")) {
    const id = e.target.parentNode.dataset.id;
    const memos = getLocalStorageItem("memos");
    delete memos[id];
    setLocalStorageItem("memos", memos);

    board.removeChild(e.target.parentNode);
  }
};

function handleMemoResizeStart(e) {
  e.preventDefault();

  activeMemo = e.target.parentNode;
  activeMemo.classList.add("active");
  activeMemo.style.zIndex = "99999";

  document.body.style.cursor = "nw-resize";

  e.target.style.backgroundColor = "rgba(0, 0, 0, 0.05)";

  const y = snapToGrid(e.clientY, GRID_SIZE);
  const x = snapToGrid(e.clientX, GRID_SIZE);

  const rect = activeMemo.getBoundingClientRect();
  const width = parseInt(rect.width, 10);
  const height = parseInt(rect.height, 10);

  currentMouse = { x, y };
  currentSize = { width, height };

  document.addEventListener("mousemove", handleMemoResizeMove, false);
  document.addEventListener("touchmove", handleMemoResizeMove, false);

  document.addEventListener("mouseup", handleMemoResizeEnd, false);
  document.addEventListener("touchcancel", handleMemoResizeEnd, false);
  document.addEventListener("touchend", handleMemoResizeEnd, false);
};

function handleMemoResizeMove(e) {
  e.preventDefault();

  const isActive = activeMemo.classList.contains("active");

  if (isActive) {
    const x = snapToGrid(e.clientX, GRID_SIZE);
    const y = snapToGrid(e.clientY, GRID_SIZE);

    const width = (currentSize.width + (x - currentMouse.x)) - 1;
    const height = (currentSize.height + (y - currentMouse.y)) - 1;

    activeMemo.style.width = `${width}px`;
    activeMemo.style.height = `${height}px`;
  }
};

function handleMemoResizeEnd(e) {
  e.preventDefault();

  const x = snapToGrid(e.clientX, GRID_SIZE);
  const y = snapToGrid(e.clientY, GRID_SIZE);

  const width = (currentSize.width + (x - currentMouse.x)) - 1;
  const height = (currentSize.height + (y - currentMouse.y)) - 1;

  activeMemo.style.width = `${width}px`;
  activeMemo.style.height = `${height}px`;

  const resize = activeMemo.querySelectorAll(".resize")[0];
  resize.style.cursor = "nw-resize";
  resize.style.backgroundColor = "transparent";

  activeMemo.classList.remove("active");

  const id = activeMemo.dataset.id;
  const memos = getLocalStorageItem("memos");
  memos[id] = { ...memos[id], size: { width, height } };
  setLocalStorageItem("memos", memos);

  document.body.style.cursor = null;
  activeMemo = null;
  currentSize = null;

  document.removeEventListener("mousemove", handleMemoResizeMove, false);
  document.removeEventListener("touchmove", handleMemoResizeMove, false);

  document.removeEventListener("mouseup", handleMemoResizeEnd, false);
  document.removeEventListener("touchcancel", handleMemoResizeEnd, false);
  document.removeEventListener("touchend", handleMemoResizeEnd, false);
};

/*
  Board Functions and Handlers
*/

function handleBoardDragStart(e) {
  document.body.style.cursor = "crosshair";

  const rect = board.getBoundingClientRect();
  const x = snapToGrid(e.clientX - rect.left, GRID_SIZE);
  const y = snapToGrid(e.clientY - rect.top, GRID_SIZE);

  currentMouse = { x, y };

  selection = document.createElement("div");
  selection.setAttribute("id", "selection");

  board.appendChild(selection);

  document.addEventListener("mousemove", handleBoardDragMove, false);
  document.addEventListener("touchmove", handleBoardDragMove, false);

  document.addEventListener("mouseup", handleBoardDragEnd, false);
  document.addEventListener("touchcancel", handleBoardDragEnd, false);
  document.addEventListener("touchend", handleBoardDragEnd, false);
};

function handleBoardDragMove(e) {
  const rect = board.getBoundingClientRect();
  const x = snapToGrid(e.clientX - rect.left, GRID_SIZE);
  const y = snapToGrid(e.clientY - rect.top, GRID_SIZE);

  const top = (y - currentMouse.y < 0) ? y : currentMouse.y;
  const left = (x - currentMouse.x < 0) ? x : currentMouse.x;
  const width = Math.abs(x - currentMouse.x) + 1;
  const height = Math.abs(y - currentMouse.y) + 1;

  selection.style.top = `${top}px`;
  selection.style.left = `${left}px`;
  selection.style.width = `${width}px`;
  selection.style.height = `${height}px`;
};

function handleBoardDragEnd(e) {
  const rect = board.getBoundingClientRect();
  const x = snapToGrid(e.clientX - rect.left, GRID_SIZE);
  const y = snapToGrid(e.clientY - rect.top, GRID_SIZE);

  const width = Math.abs(x - currentMouse.x) - 1;
  const height = Math.abs(y - currentMouse.y) - 1;

  const top = (y - currentMouse.y < 0) ? y : currentMouse.y;
  const left = (x - currentMouse.x < 0) ? y : currentMouse.x;

  if (width >= 50 && height >= 50) {
    const id = uuidv4();
    const memo = createMemo(id, null, { top, left }, { width, height });
    board.appendChild(memo);

    const memos = getLocalStorageItem("memos");
    memos[id] = { text: null, position: { top, left }, size: { width, height } };
    setLocalStorageItem("memos", memos);
  }

  document.body.style.cursor = null;
  board.removeChild(selection);

  document.removeEventListener("mousemove", handleBoardDragMove, false);
  document.removeEventListener("touchmove", handleBoardDragMove, false);

  document.removeEventListener("mouseup", handleBoardDragEnd, false);
  document.removeEventListener("touchcancel", handleBoardDragEnd, false);
  document.removeEventListener("touchend", handleBoardDragEnd, false);
};

/*
  App Functions
*/

function onResize() {
  main.style.width = `${window.innerWidth}px`;
  main.style.height = `${window.innerHeight}px`;

  width = (window.innerWidth - MARGIN) - 1;
  height = (window.innerHeight - MARGIN) + 1;

  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);

  canvas.style.top = `${MARGIN / 2}px`;
  canvas.style.left = `${MARGIN / 2}px`;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");

  for (let x = 0; x <= width; x += GRID_SIZE) {
    for (let y = 0; y <= height; y += GRID_SIZE) {
      context.fillStyle = "rgba(0, 0, 0, 0.5)";
      context.beginPath();
      context.rect(x, y, 1, 1);
      context.fill();
    }
  }

  board.style.top = `${MARGIN / 2}px`;
  board.style.left = `${MARGIN / 2}px`;
  board.style.width = `${width}px`;
  board.style.height = `${height}px`;
};

function onLoad() {
  main = document.createElement("main");
  main.setAttribute("id", "app");

  canvas = document.createElement("canvas");
  canvas.setAttribute("id", "grid");

  board = document.createElement("section");
  board.setAttribute("id", "board");

  board.addEventListener("mousedown", onMouseDown, false);
  board.addEventListener("touchstart", onMouseDown, false);

  main.appendChild(canvas);
  main.appendChild(board);
  document.body.appendChild(main);

  const memos = getLocalStorageItem("memos");
  if (!memos) {
    setLocalStorageItem("memos", {});
  } else {
    Object.keys(memos).forEach(function (key) {
      const memo = createMemo(key, memos[key].text, memos[key].position, memos[key].size);
      board.appendChild(memo);
    });
  }

  onResize();
};

window.addEventListener("resize", onResize, false);
window.addEventListener("load", onLoad, false);