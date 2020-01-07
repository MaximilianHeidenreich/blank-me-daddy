import { snapToGrid, uuidv4 } from "../utils";
import { GRID_SIZE } from "../globals";

import Element from "./element";
import MemoElement from "./memoElement";
import SelectionElement from "./selectionElement";

export default class BoardElement extends Element {
  constructor(top, left, width, height) {
    super("section");

    this._handleCreateStart = this._handleCreateStart.bind(this);
    this._handleCreateMove = this._handleCreateMove.bind(this);
    this._handleCreateEnd = this._handleCreateEnd.bind(this);

    this._handleOnMemoClose = this._handleOnMemoClose.bind(this);

    this._invalidateEvents = this._invalidateEvents.bind(this);

    this.attribute("id", "container");

    this._initialMouse = { x: 0, y: 0 };
    this._currentMouse = { x: 0, y: 0 };
    this._memoElements = {};

    this._selectionElement = null;

    this.style("top", `${top}px`);
    this.style("left", `${left}px`);
    this.style("width", `${width}px`);
    this.style("height", `${height}px`);

    this.addEvent("mousedown", this._handleCreateStart);
    this.addEvent("touchstart", this._handleCreateStart);
  }

  // Private methods

  _handleCreateStart(e) {
    if (e.target === this.element) {
      document.body.style.cursor = "crosshair";

      const mouseX = snapToGrid(e.clientX - this.rect.left, GRID_SIZE);
      const mouseY = snapToGrid(e.clientY - this.rect.top, GRID_SIZE);

      this._initialMouse = { x: mouseX, y: mouseY };

      this._selectionElement = new SelectionElement();
      this.appendElement(this._selectionElement.element);

      this.addEvent("mousemove", this._handleCreateMove);
      this.addEvent("mouseup", this._handleCreateEnd);
      this.addEvent("touchmove", this._handleCreateMove);
      this.addEvent("touchend", this._handleCreateEnd);
    }
  };

  _handleCreateMove(e) {
    const mouseX = snapToGrid(e.clientX - this.rect.left, GRID_SIZE);
    const mouseY = snapToGrid(e.clientY - this.rect.top, GRID_SIZE);

    const width = Math.abs(mouseX - this._initialMouse.x) + 1;
    const height = Math.abs(mouseY - this._initialMouse.y) + 1;

    const top = (mouseY - this._initialMouse.y < 0) ? mouseY : this._initialMouse.y;
    const left = (mouseX - this._initialMouse.x < 0) ? mouseX : this._initialMouse.x;

    this._selectionElement.style("top", `${top}px`);
    this._selectionElement.style("left", `${left}px`);
    this._selectionElement.style("width", `${width}px`);
    this._selectionElement.style("height", `${height}px`);
  };

  _handleCreateEnd(e) {
    const mouseX = snapToGrid(e.clientX - this.rect.left, GRID_SIZE);
    const mouseY = snapToGrid(e.clientY - this.rect.top, GRID_SIZE);

    const width = Math.abs(mouseX - this._initialMouse.x) - 1;
    const height = Math.abs(mouseY - this._initialMouse.y) - 1;

    const top = (mouseY - this._initialMouse.y < 0) ? mouseY : this._initialMouse.y;
    const left = (mouseX - this._initialMouse.x < 0) ? mouseX : this._initialMouse.x;

    if (width >= 50 && height >= 50) {
      const id = uuidv4();
      const memoElement = new MemoElement(id, { top, left }, { width, height });
      memoElement.onMemoEdit = this._handleOnMemoEdit;
      memoElement.onMemoClose = this._handleOnMemoClose;

      this._memoElements[id] = memoElement;
      this.appendElement(memoElement.element);
    }

    document.body.style.cursor = null;

    this.removeElement(this._selectionElement.element);
    this._selectionElement = null;

    this._invalidateEvents();
  };

  _handleOnMemoClose(id) {
    if (window.confirm("Are you sure you would like to delete this memo?")) {
      const memoElement = this._memoElements[id];
      this.removeElement(memoElement.element);
      delete this._memoElements[id];
    }
  };

  _invalidateEvents() {
    this._initialMouse = { x: 0, y: 0 };

    this.removeEvent("mousemove", this._handleCreateMove);
    this.removeEvent("mouseup", this._handleCreateEnd);
    this.removeEvent("touchmove", this._handleCreateMove);
    this.removeEvent("touchend", this._handleCreateEnd);
  };
};