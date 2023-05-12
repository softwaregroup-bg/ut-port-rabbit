const verify = {
    crv: 'P-384',
    x: '7lbuz4NiWPP7qUf7sEtVrmwIsyqlEcISOYlZyhxdfZAo9CktLmlgGmCaVAeJ5WQF',
    y: '35TmvABjyanp7-RJ-EyVh9U70KPo17v-dKXbt61_ZkSpIeq4hRALHggl1skEhpTy',
    kty: 'EC',
    kid: 'SMHzwMrfWgL7cMddnPfmz_vfDvzou81rB1aZrcNXujs',
    alg: 'ES384',
    use: 'sig'
};
const encrypt = {
    crv: 'P-384',
    x: 'cUcxQIA4kvLmonQiqEMPsWk2zSkO8JeL0NJhp6xDpg6KxA6LRzE16yV_JksBKNik',
    y: 'xPOLCt6ad6Q9U7PZeSMpTLprSEPID0tkII1s0113oSWENVL0WaF8gHCcnZFW_Xsx',
    kty: 'EC',
    kid: 'rUoGmRI733zodiQ4UTf-J2xwiH1U5Hh5TBzEx20iDjM',
    alg: 'ECDH-ES+A256KW',
    use: 'enc'
};

const mle = {
    protectedHeader: {typ: 'JWT'},
    sign: {...verify, d: 'W1BRsM0Et00sxNUiHhBW4J6WeFTIERMD4xlpctpcgVwrzbMMU9ercxd4mogwHlx_'},
    decrypt: {...encrypt, d: 'HEqymCISfMhJVu1EuLO6sN8JhnYPdy19phyXO_XGMM6uKgt3r_M-dFnhV0kMjfrx'},
    encrypt,
    verify
};

require('./run')({
    exchange: 'ut-port-rabbit-mle',
    mle
});
