/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const SHA256 = require('crypto-js/sha256');

/* ===== Persist data with LevelDB =======================
|  Learn more: level: https://github.com/Level/level     |
|  =====================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
    constructor(data){
        this.hash = "",
        this.height = 0,
        this.body = data,
        this.time = 0,
        this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for a new blockchain   |
|  ===============================================*/

class Blockchain{
    constructor() {
        this.getBlockHeight().then((height) => {
            if (height < 0) {
                console.log('Genesis block - First block in the chain');
                this.addBlock(new Block("First block in the chain - Genesis block"));              
            }
        });
    }


    // add new block
    async addBlock(block_new){
        const height = parseInt(await this.getBlockHeight()); 
        block_new.height = height + 1;

        // UTC timestamp
        block_new.time = new Date().getTime().toString().slice(0,-3);

        // Previous block hash
        if (block_new.height > 0 ){
            const block = await this.getBlock(height);
            block_new.previousBlockHash = block.hash;
        }


        // Block hash with SHA256 using block_new and converting to a string
        block_new.hash = SHA256(JSON.stringify(block_new)).toString();

        // Adding block object to chain
        await this.AddBlockToDB(block_new.height, JSON.stringify(block_new));
    }

    // get Block height
    async getBlockHeight(){
        return await this.GetBlockHeightFromDB()-1;
    }    


    // get Block 
    async getBlock(height) {
        return JSON.parse(await this.GetBlockFromDB(height));
    }


    // validate block
    async validateBlock(height){
        //get block object
        let block = await this.getBlock(height);
        //get block hash
        let blockHash = block.hash;
        //remove block hash
        block.hash = "";
        //generate block hash -> validBlockHash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        //Comparison between blockHash and validBlockHash
        if (blockHash === validBlockHash) {
            return true;
        } else {
            console.log('Block #' + height + ' is not valid');
            return false;
            }
    }
    
    // validate blockchain
    async validateChain() {
        let errorLog = [];

        const height = await this.getBlockHeight();

        for (var i=0; i< height; i++) {
            
            // validate block
            if (!this.validateBlock(i))errorLog.push(i);
            
            if (i == height -1) {
                if (errorLog.length > 0) {
                    console.log('Number of block errors = ' + errorLog.length);
                    console.log('Blocks with errors: ' + errorLog);
                } else {
                    console.log('Blockchain valid');
                    }
                }                       
            }

            
    }

/* ===== Persist data with LevelDB - Database=============
|  Learn more: level: https://github.com/Level/level     |
|  =====================================================*/
    
    // Add data to levelDB 
    AddBlockToDB(key,value) {
        return new Promise((resolve, reject) => {
            db.put(key, value, function(err) {
                if (err) {
                    console.log('Block #' + key +" is not added to Database/Chain - Sorry", err)
                    reject();
                } else {
                    console.log('Block #' + key +" is added to Database/Chain - Congrats", err)
                resolve(value);
                }
            });
        });
    }

    // Get data from levelDB with key
    GetBlockFromDB(key) {
        return new Promise((resolve, reject) => {
            db.get(key, function(err, value) {
                if (err) {
                    console.log("Block can not be thrown from Database "+ key + " ",err);
                    reject(err);
                } else {
                resolve(value);
                }
            })
        })
    }

    // Get data from levelDB with read stream  GetBlockHeightFromDB() {
        
    GetBlockHeightFromDB () { 
        return new Promise((resolve, reject) => {
            let i = 0
            db.createReadStream()
            .on('data', function(data) {i++
            })
            .on('error', function(err) {
                console.log('getBlockHeight error: ', err)
                reject(err);
            })
            .on('close', function() {
                resolve(i);
            })
        })
    }
} //End of Class Blockchain

/* ===== TESTING ========================================
|  To create test blocks on your Private Blockchain     |
|  =====================================================*/

let blockchain = new Blockchain();

(function theLoop (i) {
  setTimeout(() => {
    blockchain.addBlock(new Block(`Test data ${i}`)).then(() => {
      if (--i) {
        theLoop(i)
      }
    })
  }, 100);
})(10);

setTimeout(() => blockchain.validateChain(), 2000)
