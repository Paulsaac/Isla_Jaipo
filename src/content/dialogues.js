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
    "Naaaaaaahhh que grandeee",
    "Eres increible, muchas gracias por encontrarlo!",
    { action: 'dap' },
    "Está bastante maltratado, pero lo voy a dejar en un lugar especial.",
    "Gracias de nuevo. Te dejé un mapa en el cofre del otro cuarto para que puedas orientarte por la isla.",
    "Para agradecerte, voy a darte las llaves del puente. El único problema es que tengo que encontrarlas... La verdad no voy hace mucho tiempo al pueblo y no tengo idea donde estarán.",
    "A penas las encuentre, te haré saber.",
    "Mientras taaanto, te recomiendo explorar el lugar, es muy bonito. Solía caminar horas por el bosque. Siempre me sorprendía.",
    "Sobre todo cuando miraba la luna tomando mate.... Pasaban cosas interesantes."
];

export const heartDeliveredDialogs = [
    "Gracias de nuevo. Aún no encuentro la llave, pero te haré saber cuando la encuentre... Mientras tanto, siéntete libre de salir a conocer los alrededores y volver cuando quieras.",
    "Siempre habrá un techo y un mate para ti."
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

// Habitante del rincón izquierdo del entretecho.
export const atticAntDialogs = ['no le digas a nadie que vivo aqui'];

export const mateOfferDialogs = ['Quieres mate?'];
export const mateAlreadyHeldDialogs = ['Ya tengo uno.'];
