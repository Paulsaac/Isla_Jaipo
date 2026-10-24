// El arranque presenta la transición; el mundo informa cuándo está listo.
let finish = async () => {};
let onError = () => {};

export function configureStartTransition(callbacks) {
    finish = callbacks.finish;
    onError = callbacks.onError;
}

export async function finishStartTransition() {
    await finish();
}

export function failStartTransition(error) {
    onError(error);
}
