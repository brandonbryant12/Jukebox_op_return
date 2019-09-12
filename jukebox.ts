#!/usr/bin/env ts-node

require('dotenv').config();

import * as program from 'commander';

const datapay = require('datapay');
const explorer = require('bitcore-explorers');
const bitcoin = require('bsv');


function callback(res){

  console.log("callback", )

}

//let url ='https://soundcloud.com/capitalinterest/capital-interest-work-jam-2019-08-30-10h49m38'
program
  .command('playsong <url>')
  .action(async (url) => {


    const key = 'L2n9J4UzXDpJrbgo8gMVS3BmBSMZCJsmvStyPTkCQXYFdu2rxYR5';
    const privateKey = new bitcoin.PrivateKey(key);
    const address = privateKey.toAddress();
    const insight = new explorer.Insight('https://api.bitindex.network')

    insight.getUnspentUtxos(address, async function (err, res) {

      if(err){

        console.log('error', err)

        return;

      }

      console.log('res', res)
  
      let tx = new bitcoin.Transaction()
                          .from(res[1])
                          .to('1MqjrXZuy5Ad22iH1qVHGe4WPhX8CYJfag', 1000)
                          .fee(400)
                          .change(address)

      let options = {
        safe : false,
        data : [`j"1MqjrXZuy5Ad22iH1qVHGe4WPhX8CYJfagF${url}`]
      }

      var script = _script(options)
    
      tx.addOutput(new bitcoin.Transaction.Output({ script: script, satoshis: 0 }));

      tx.sign(privateKey)

      insight.broadcast(tx.toString(), callback)

    })

  });

program.parse(process.argv);


var _script = function(options) {
  var s = null;
  if (options.data) {
    if (Array.isArray(options.data)) {
      s = new bitcoin.Script();
      if (options.safe) {
        s.add(bitcoin.Opcode.OP_FALSE);
      }
      // Add op_return
      s.add(bitcoin.Opcode.OP_RETURN);
      options.data.forEach(function(item) {
        // add push data
        if (item.constructor.name === 'ArrayBuffer') {
          let buffer = Buffer.from(item)
          s.add(buffer)
        } else if (item.constructor.name === 'Buffer') {
          s.add(item)
        } else if (typeof item === 'string') {
          if (/^0x/i.test(item)) {
            // ex: 0x6d02
            console.log('here')
            s.add(Buffer.from(item.slice(2), "hex"))
          } else {
            // ex: "hello"
            s.add(Buffer.from(item))
          }
        } else if (typeof item === 'object' && item.hasOwnProperty('op')) {
          s.add({ opcodenum: item.op })
        }
      })
    } else if (typeof options.data === 'string') {
      // Exported transaction
      s = bitcoin.Script.fromHex(options.data);
    }
  }
  return s;
}
