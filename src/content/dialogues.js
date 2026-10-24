export const grahamWakeGreetings = [
    'Oh, ¡Hola!',
    'Que bueno que despertaste. Ven, tengo hecho un mate.'
];

// Dialogo introductorio vigente de Graham; conservar el orden.
export const npcDialogs = [
    "Ya me estaba preocupando porque no despertabas.",
    "Te encontré tirado en la playa al sur de esta casa, mientras regaba mi huerta.",
    "¿No recuerdas nada? Uff, que mal... Eso debe ser duro...",
    "¿Yo? Soy Graham y cuido este bosque, o al menos lo intento...",
    "La verdad es que ya estoy bastante viejo, últimamente, con mucha suerte puedo talar un poco de leña.",
    "¿Que cómo podrías agradecerme por traerte hasta aquí? Bueno… Pues la verdad si necesito algo.",
    { text: "Necesito pedirte que encuentres el Corazon del Bosque.", highlight: "Corazon del Bosque" },
    "Es un corazon de madera que me pertenecía hace tiempo, pero lo perdí por el bosque.",
    "Es muy importante para mi, y desde que lo perdi, todo se siente... Desencajado... ¿Me entiendes?",
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
    { text: "Sientete como en casa. Solo te pido a cambio ayudarme a encontrar el Corazon del Bosque.", highlight: "Corazon del Bosque" }
];

export const heartDeliveryDialogs = [
    "¡¿Lo encontraste?!",
    "Eres increíble... ¡De verdad muchas gracias por encontrarlo!",
    "Está bastante maltratado, pero lo voy a guardar y cuidarlo bien.",
    "Te dejé un mapa en el cofre del otro cuarto para que puedas orientarte por la isla.",
    "Y como recompensa por encontrar el Corazón del Bosque, voy a darte las llaves del puente que lleva al pueblo.",
    "El único problema es que tengo que encontrarlas... La verdad no voy hace mucho tiempo al pueblo y no tengo idea donde estarán.",
    "A penas las encuentre, te haré saber.",
    "Mientras tanto, te recomiendo explorar el lugar, es muy bonito. Solía caminar horas por el bosque. Siempre me sorprendía.",
    "Sobre todo cuando miraba la luna tomando mate... Pasaban cosas interesantes."
];

export const heartDeliveredDialogs = [
    "Aún no encuentro las llaves... Pero te recomiendo explorar el lugar, es muy bonito. Solía caminar horas por el bosque. Siempre me sorprendía.",
    "Sobre todo cuando miraba la luna tomando mate... Pasaban cosas interesantes."
];

// La entrega de la llave queda habilitada mediante el parámetro de configuración.
export const bridgeKeyDeliveryDialogs = [
    "¡Encontré la llave del puente!",
    "Aquí tienes.",
    { action: 'give-bridge-key' },
    "Ahora puedes cruzar el puente y conocer el resto de la isla.",
    "Nuevamente, muchas gracias por encontrar el Corazón del Bosque.",
    "Aquí siempre tendras un hogar y un mate recien hecho."
];
export const bridgeKeyReceivedDialogs = [
    "Gracias de nuevo por recuperar el Corazón del Bosque.",
    "Ahora que tienes la llave del puente ¡Disfruta tu viaje por la isla!",
    "Recuerda el regalo que te dejé en el cofre del otro cuarto: un mapa para orientarte mejor."
];

// Habitante del rincón izquierdo del entretecho.
export const atticAntDialogs = ['no le digas a nadie que vivo aqui'];

export const mateOfferDialogs = ['Ten. Cuidado que está caliente.'];
export const mateAlreadyHeldDialogs = ['Ya tengo uno.'];
