/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    async initializeChain() {
      if(this.height === -1){
        const block = new BlockClass.Block({data: 'Genesis Block'});
        await this._addBlock(block);
      }
    }

    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
           try {
               if (self.height > -1) block.previousBlockHash = self.chain[self.height].hash;
               self.height = self.height + 1;
               block.height = self.height;
               block.time = new Date().getTime().toString().slice(0,-3);
               block.hash = SHA256(JSON.stringify(block)).toString();
               self.chain.push(block);
               const res = await self.validateChain();

               console.log("resはない", res.length)
               if (res.length > 0) {
                   self.chain.pop(); // delete block
                   throw 'not valid chain'
               } else {
                console.log("success: add block")
                resolve(block);
               }
           } catch (error) {
               console.error(`error!: reason: ${error}`);
               reject(error);
           }
        });
    }

    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(
                `${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`
            )
        });
    }

    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            const timeInMessage = parseInt(message.split(':')[1]);
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            if ((currentTime - timeInMessage) <= 300 && bitcoinMessage.verify(message, address, signature)) {
                const newBlock = new BlockClass.Block({
                    owner: address,
                    star: star,
                });
                return resolve(self._addBlock(newBlock));
            } else {
                return reject();
            }
        });
    }

    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.hash === hash)[0];
            if(block){
                resolve(block);
            } else {
                reject(null);
            }
        });
    }

    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];

            if(block){
                resolve(block);
            } else {
                reject(null)
            }
        });
    }

    getStarsByWalletAddress (address) {
        const self = this;
        let stars = [];

        return new Promise((resolve, reject) => {
            stars = self.chain.slice(1).map((p) => { if (p.getBData().owner === address) return p.getBData(); });
            console.log(stars);
            if (stars.length > 0)
            {
                resolve(stars);
            } else {
                reject([]);
            }
        });
    }

    async validateChain() {
        let self = this;
        const errorLog = await self.chain.reduce(async (prev, current, index, ary) => {
            const res = await current.validate().catch((result) => result);

            if (!res) {
              console.log("!!!!!!!!!")
              return prev.concat(current)
            }

            if (current.height > 0 && current.previousBlockHash !== self.chain[index - 1].hash) {
              return prev.concat(current)
            } else {
              return prev;
            }
        }, []);

        console.log("けっか", errorLog)

        return new Promise((resolve) => {
            resolve(errorLog);
        });
    }

}

module.exports.Blockchain = Blockchain;