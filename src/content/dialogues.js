export const grahamWakeGreetings = [
    'Ah, Hola!',
    'Que bueno que despertaste. Ven, tengo hecho un mate.'
];

// Dialogo introductorio vigente de Graham; conservar el orden.
export const npcDialogs = [
    "Que bueno que despertaste. Ya me estaba preocupando.",
    "Te encontré tirado en la playa al sur de esta casa, mientras regaba mi huerta.",
    "¿No recuerdas nada? Uff, eso debe ser duro...",
    "¿Yo? Soy Graham y cuido este bosque, o al menos lo intento...",
    "La verdad es que ya estoy bastante viejo, últimamente, con mucha suerte puedo talar un poco de leña.",
    "¿Que cómo podrías agradecerme por traerte hasta aquí? Hmm… Pues si necesito algo.",
    { text: "Necesito pedirte que encuentres el Corazon del Bosque.", highlight: "Corazon del Bosque" },
    "Es un corazon de madera que me pertenecia hace tiempo. Es muy importante para mi, y desde que lo perdi, todo se siente... Desencajado... ¿Me entiendes?",
    "Te agradecería mucho si lo pudieras encontrar. Te lo recompensare sin dudas.",
    "Ten, esta antorcha te será de ayuda."
];

// Redacción local anterior conservada como referencia durante la integración de Bosque.
export const npcDialogsPreviousDraft = [
    "¡Qué bueno que ya despiertas! Te encontré inconsciente en la playa al sur de aquí, y te traje a mi hogar.",
    "No te pediría tu ayuda en una situación como esta, pero ¿podrías hacerme el favor de ir a buscar el Corazón del Bosque?",
    "Puedo entregarte la llave del puente, así puedes ir a conocer más de esta isla, solo déjame encontrarla...",
    "Te haré saber cuando la tenga en mis manos.",
    "Llévate esta antorcha para buscar el Corazón del Bosque. Puedes encenderla y apagarla desde el inventario."
];

export const heartSearchDialogs = [
    "Sientete como en casa, si encuentras por aqui algo que te pueda servir, eres libre de utilizarlo.",
    { text: "Solo te pido a cambio ayudarme a encontrar el Corazon del Bosque.", highlight: "Corazon del Bosque" }
];

export const heartDeliveryDialogs = [
    "¡Encontraste el Corazón del Bosque! Muchas gracias por traerlo de vuelta.",
    "Sigo buscando la llave del puente. Todavía no la tengo, pero te avisaré cuando la encuentre."
];

export const heartDeliveredDialogs = [
    "Gracias de nuevo por recuperar el Corazón del Bosque.",
    "Todavía estoy buscando la llave del puente. Te avisaré cuando la tenga."
];

// La entrega de la llave queda habilitada mediante el parámetro de configuración.
export const bridgeKeyDeliveryDialogs = [
    "¡Encontré la llave del puente! Gracias por recuperar el Corazón del Bosque.",
    "Aquí tienes la llave. Ahora puedes cruzar el puente y conocer el resto de la isla.",
    "También te dejé un regalo en el cofre del otro cuarto: un mapa para que puedas orientarte mejor."
];
export const bridgeKeyReceivedDialogs = [
    "Gracias de nuevo por recuperar el Corazón del Bosque.",
    "Ya te entregué la llave del puente. ¡Disfruta tu viaje por la isla!",
    "Recuerda el regalo que te dejé en el cofre del otro cuarto: un mapa para orientarte mejor."
];
