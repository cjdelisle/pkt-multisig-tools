/*@flow*/
/*:: const requirejs = require('./bower_components/requirejs/require.js'); */
/* global window, requirejs, define */
requirejs([
    'bower_components/bitcoinjs/bitcoinjs.min.js',
    'bower_components/tweetnacl-util/nacl-util.js',
    'bower_components/jquery/dist/jquery.js',
    'bower_components/qrcodejs/qrcode.js',
    'bower_components/base43js/js/base43.js'
], (Bitcoinjs) => {
    const $ = window.jQuery;
    const Base43 = window.Base43;
    const QRCode = window.QRCode;
    let bech32;
    const getBech32 = (cb) => {
        const mod = window.module = {};
        requirejs(['bower_components/bech32/index.js'], () => {
            window.module = undefined;
            bech32 = mod.exports;
            cb();
        });
    };
    const hexToBuf = (hex) => {
        var view = new Uint8Array(hex.length / 2);
        for (var i = 0; i < hex.length; i += 2) {
            view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return view;
    };
    const encodeBase43 = (buf) => {
        const arr = (Array.from(buf) /*:any*/);
        arr.split = () => arr;
        arr.map = () => arr;
        return Base43.encode(arr);
    };
    const pkt2btc = (pktAddr) => {
        try {
            const x = Bitcoinjs.Address.fromBase58Check(pktAddr);
            if (x.version === 117) {
                x.version = 0;
                return x.toBase58Check();
            }
        } catch (e) { }
        try {
            const x = bech32.decode(pktAddr);
            if (x.prefix === 'pkt') {
                return bech32.encode('bc', x.words);
            }
        } catch (e) { }
    };
    const btc2pkt = (btcAddr) => {
        try {
            const x = Bitcoinjs.Address.fromBase58Check(btcAddr);
            if (x.version === 0) {
                x.version = 117;
                return x.toBase58Check();
            }
        } catch (e) { }
        try {
            const x = bech32.decode(btcAddr);
            if (x.prefix === 'bc') {
                return bech32.encode('pkt', x.words);
            }
        } catch (e) { }
    };
    const isBase43 = (text) => /^[0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ\$\*\+\.\/\:\-]+$/.test(text);
    const hexToBase43 = (text) => {
        if (text === '') { return ''; }
        if (/^[0-9a-f]+$/.test(text)) {
            if (text.length & 1) {
                return "[Invalid hex: Length [" + text.length +
                    "] of hex value must be a multiple of 2]";
            }
            if (text.length < 6) {
                return "[Invalid hex: Cannot render less than 3 bytes as base43]";
            }
            if (/^[0]+$/.test(text)) {
                return "[Invalid hex: Cannot render only zero bytes as base43]";
            }
            const buf = hexToBuf(text);
            return encodeBase43(buf);
        }
        return "[Invalid hex]";
    };
    const base43ToHex = (text) => {
        try {
            return Base43.decode(text);
        } catch (e) {
            return e.message;
        }
    };
    const main = () => {
        let valpkt = 0;
        let valmbtc = 0;
        let btcaddr = '[invalid]';
        let pktaddr = '[invalid]';
        let txhex = '[invalid]';
        let txb43 = '[invalid]';
        setInterval(() => {
            const newValpkt = Number($('#valpkt').val() || 0);
            const newValmbtc = Number($('#valmbtc').val() || 0);
            if (newValpkt !== valpkt) {
                valmbtc = newValpkt * 0x40000000 / 100000;
                valpkt = newValpkt;
                $('#valmbtc').val('' + valmbtc);
                console.log(valmbtc + ' mbtc');
            } else if (valmbtc !== newValmbtc) {
                valpkt = newValmbtc * 100000 / 0x40000000;
                valmbtc = newValmbtc;
                $('#valpkt').val('' + valpkt);
                console.log(valpkt + ' pkt');
            }

            const newBtcaddr = $('#btcaddr').val();
            const newPktaddr = $('#pktaddr').val();
            if (btcaddr !== newBtcaddr) {
                pktaddr = btc2pkt(newBtcaddr) || '[invalid]';
                btcaddr = newBtcaddr;
                $('#pktaddr').val(pktaddr);
            } else if (pktaddr !== newPktaddr) {
                btcaddr = pkt2btc(newPktaddr) || '[invalid]';
                pktaddr = newPktaddr;
                $('#btcaddr').val(btcaddr);
            }

            do {
                const newTxhex = $('#txhex').val();
                const newTxb43 = $('#txb43').val();
                if (newTxhex !== txhex) {
                    txb43 = hexToBase43(newTxhex);
                    console.log(txb43);
                    $('#txb43').val(txb43);
                    txhex = newTxhex;
                } else if (newTxb43 !== txb43) {
                    txhex = base43ToHex(newTxb43);
                    $('#txhex').val(txhex);
                    txb43 = newTxb43;
                } else {
                    break;
                }
                $("#qrcode").empty();
                if (isBase43(txb43)) {
                    new QRCode($("#qrcode")[0], txb43);
                }
            } while (0);
        }, 100);
    };
    $(() => getBech32(main));
});
