/**
 * デモの操作 UI を仕様から組み立てる。
 * 18 個のデモそれぞれにスライダーの DOM を手書きしないための共通部品。
 */

import { el } from './dom.ts';

export type ControlSpec =
  | {
      kind: 'range';
      id: string;
      label: string;
      min: number;
      max: number;
      step: number;
      value: number;
      /** 右側に出す表示文字列。省略時は小数2桁。 */
      format?: (value: number) => string;
    }
  | { kind: 'check'; id: string; label: string; value: boolean }
  | {
      kind: 'select';
      id: string;
      label: string;
      value: string;
      options: { value: string; label: string }[];
    }
  | { kind: 'button'; id: string; label: string; primary?: boolean };

export type ControlValues = Record<string, number | boolean | string>;

export interface Controls {
  root: HTMLElement;
  values: ControlValues;
  num(id: string): number;
  bool(id: string): boolean;
  str(id: string): string;
  /** 値が変わったときに呼ばれる。 */
  onChange(fn: (id: string) => void): void;
  /** button が押されたときに呼ばれる。 */
  onClick(fn: (id: string) => void): void;
  /** 外から値を書き戻す（リセットボタンなど）。 */
  set(id: string, value: number | boolean | string): void;
}

const defaultFormat = (value: number): string => value.toFixed(2);

export function createControls(specs: ControlSpec[]): Controls {
  const root = el('div', { class: 'ctrls' });
  const values: ControlValues = {};
  const changeHandlers: ((id: string) => void)[] = [];
  const clickHandlers: ((id: string) => void)[] = [];
  const inputs = new Map<string, HTMLInputElement | HTMLSelectElement>();
  const outputs = new Map<string, HTMLElement>();
  const formats = new Map<string, (value: number) => string>();

  const emit = (id: string): void => {
    for (const fn of changeHandlers) fn(id);
  };

  let buttonRow: HTMLElement | null = null;

  for (const spec of specs) {
    if (spec.kind === 'button') {
      buttonRow ??= el('div', { class: 'ctrl__buttons' });
      const button = el(
        'button',
        { class: `btn${spec.primary ? ' btn--primary' : ''}`, type: 'button' },
        spec.label,
      );
      button.addEventListener('click', () => {
        for (const fn of clickHandlers) fn(spec.id);
      });
      buttonRow.appendChild(button);
      continue;
    }

    if (spec.kind === 'range') {
      values[spec.id] = spec.value;
      formats.set(spec.id, spec.format ?? defaultFormat);

      const input = el('input', {
        type: 'range',
        id: `c-${spec.id}`,
        min: spec.min,
        max: spec.max,
        step: spec.step,
        value: spec.value,
      });
      const output = el(
        'span',
        { class: 'ctrl__value' },
        (spec.format ?? defaultFormat)(spec.value),
      );
      input.addEventListener('input', () => {
        const next = Number(input.value);
        values[spec.id] = next;
        output.textContent = (formats.get(spec.id) ?? defaultFormat)(next);
        emit(spec.id);
      });

      inputs.set(spec.id, input);
      outputs.set(spec.id, output);
      root.appendChild(
        el(
          'div',
          { class: 'ctrl' },
          el('label', { class: 'ctrl__label', for: `c-${spec.id}` }, spec.label),
          input,
          output,
        ),
      );
      continue;
    }

    if (spec.kind === 'check') {
      values[spec.id] = spec.value;
      const input = el('input', {
        type: 'checkbox',
        id: `c-${spec.id}`,
        checked: spec.value,
      });
      input.addEventListener('change', () => {
        values[spec.id] = input.checked;
        emit(spec.id);
      });
      inputs.set(spec.id, input);
      root.appendChild(
        el(
          'div',
          { class: 'ctrl ctrl--check' },
          el('span', { class: 'ctrl__label' }, ''),
          el('label', { for: `c-${spec.id}` }, input, spec.label),
        ),
      );
      continue;
    }

    // select
    values[spec.id] = spec.value;
    const select = el('select', { id: `c-${spec.id}` });
    for (const option of spec.options) {
      const node = el('option', { value: option.value }, option.label);
      if (option.value === spec.value) node.selected = true;
      select.appendChild(node);
    }
    select.addEventListener('change', () => {
      values[spec.id] = select.value;
      emit(spec.id);
    });
    inputs.set(spec.id, select);
    root.appendChild(
      el(
        'div',
        { class: 'ctrl' },
        el('label', { class: 'ctrl__label', for: `c-${spec.id}` }, spec.label),
        select,
        el('span', { class: 'ctrl__value' }, ''),
      ),
    );
  }

  if (buttonRow) root.appendChild(buttonRow);

  return {
    root,
    values,
    num: (id) => Number(values[id] ?? 0),
    bool: (id) => Boolean(values[id]),
    str: (id) => String(values[id] ?? ''),
    onChange: (fn) => void changeHandlers.push(fn),
    onClick: (fn) => void clickHandlers.push(fn),
    set(id, value) {
      values[id] = value;
      const input = inputs.get(id);
      if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else input.value = String(value);
      } else if (input instanceof HTMLSelectElement) {
        input.value = String(value);
      }
      const output = outputs.get(id);
      if (output && typeof value === 'number') {
        output.textContent = (formats.get(id) ?? defaultFormat)(value);
      }
      emit(id);
    },
  };
}

/* ---- 数値の読み出し ---- */

export interface Readouts {
  root: HTMLElement;
  set(key: string, value: string): void;
}

export function createReadouts(
  items: { key: string; label: string; color?: string }[],
): Readouts {
  const root = el('div', { class: 'readouts' });
  const cells = new Map<string, HTMLElement>();

  for (const item of items) {
    const value = el('span', {
      class: 'readout__val',
      style: item.color ? `--readout-color:${item.color}` : null,
    }, '—');
    cells.set(item.key, value);
    root.appendChild(
      el(
        'span',
        { class: 'readout' },
        el('span', { class: 'readout__key' }, item.label),
        value,
      ),
    );
  }

  return {
    root,
    set(key, value) {
      const cell = cells.get(key);
      if (cell) cell.textContent = value;
    },
  };
}

/* ---- 凡例（色だけに頼らないための説明） ---- */

export function createLegend(
  items: { label: string; color: string; dashed?: boolean }[],
): HTMLElement {
  return el(
    'div',
    { class: 'legend' },
    ...items.map((item) =>
      el(
        'span',
        { class: 'legend__item' },
        el('span', {
          class: 'legend__swatch',
          style: `--sw:${item.color}`,
          'data-dashed': item.dashed ? 'true' : null,
        }),
        item.label,
      ),
    ),
  );
}
