// Shared client behavior for the category filter rows used by the posts and
// labs sections. Both render the same markup contract: a container of
// `button[data-f]` chips plus a grid of `.post[data-cat]` cards. Keeping the
// toggle here once means the two sections can't drift apart on the parts that
// matter for accessibility — the active chip keeps `aria-pressed` in sync
// with its visual state, and `aria-controls` on the chips points at `gridId`.

/**
 * Wire a filter chip row to the card grid it filters.
 *
 * @param filterContainerId id of the element holding the `.fbtn` chips
 * @param gridId id of the element holding the `.post` cards
 */
export function initFilterSection(filterContainerId: string, gridId: string): void {
  const controls = document.getElementById(filterContainerId);
  const grid = document.getElementById(gridId);
  if (!controls || !grid) return;

  controls.addEventListener('click', (event) => {
    const target = event.target;
    const button = target instanceof Element ? target.closest('button[data-f]') : null;
    if (!(button instanceof HTMLButtonElement)) return;
    const category = button.dataset.f;

    controls.querySelectorAll<HTMLButtonElement>('.fbtn').forEach((filter) => {
      const active = filter.dataset.f === category;
      filter.classList.toggle('on', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    grid.querySelectorAll<HTMLElement>('.post').forEach((card) => {
      card.classList.toggle('hidden', category !== 'all' && card.dataset.cat !== category);
    });
  });
}
