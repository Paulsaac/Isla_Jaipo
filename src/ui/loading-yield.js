// Repartir la preparación sin avanzar física, quests ni el reloj del juego.
export function createLoadingYield(budgetMs = 6) {
    let resumed = performance.now();
    return function checkpoint() {
        if (performance.now() - resumed < budgetMs) return null;
        return new Promise(resolve => setTimeout(() => {
            resumed = performance.now();
            resolve();
        }, 0));
    };
}
