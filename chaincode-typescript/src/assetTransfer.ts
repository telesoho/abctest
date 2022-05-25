// Deterministic JSON.stringify()
import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {ClientIdentity} from 'fabric-shim-api';

import {Asset} from './asset';

@Info({title: 'AssetTransfer', description: 'Smart contract for trading assets'})
export class AbctestContract extends Contract {


    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {

        const cid = ctx.clientIdentity;
        if (!cid.assertAttributeValue("hf.Type","admin"))
        {
            throw new Error(`Access deny ${cid.getAttributeValue('hf.EnrollmentID')}`);
        }

        console.log(cid);
        
        const assets: Asset[] = [
            {
                Type: 'money',
                Owner: 'telesoho',
                Value: 100,
            },
            {
                Type: 'money',
                Owner: 'Tomoko',
                Value: 100,
            },
        ];

        for (const asset of assets) {
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            const id = `${asset.Owner}:${asset.Type}`; 
            await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
            console.info(`Asset ${id} initialized`);
        }
    }

    private getId(type:string, owner:string): string {
        return  `${owner}:${type}`;
    }

    private isAdmin(ctx: Context): boolean {
        const cid = ctx.clientIdentity;
        const isAdmin = cid.assertAttributeValue("abctest.role","admin");
        return isAdmin;
    }

    // CreateAsset issues a new asset to the world state with given details.
    @Transaction()
    public async CreateAsset(ctx: Context, type:string, owner: string, value: number): Promise<void> {
        if (!this.isAdmin(ctx)) {
            throw new Error(`Access deny!`);
        }

        const id = this.getId(type, owner);
        const exists = await this.AssetExists(ctx, type, owner);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            Type: type,
            Owner: owner,
            Value: value,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadAsset(ctx: Context, type: string, owner: string): Promise<string> {
        const id = this.getId(type, owner);
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // DeleteAsset deletes an given asset from the world state.
    @Transaction()
    public async DeleteAsset(ctx: Context, type:string, owner: string): Promise<void> {
        if(!this.isAdmin(ctx))
        {
            throw new Error(`Access deny`);
        }

        const id = this.getId(type, owner);
        const exists = await this.AssetExists(ctx, type, owner);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    @Transaction()
    public async UpdateAsset(ctx: Context, type:string, owner: string, value: number): Promise<void> {

        if(!this.isAdmin(ctx))
        {
            throw new Error(`Access deny`);
        }

        const id = this.getId(type, owner);
        const exists = await this.AssetExists(ctx, type, owner);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            Type: type,
            Owner: owner,
            Value: value,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // AssetExists returns true when asset with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async AssetExists(ctx: Context, type: string, owner:string): Promise<boolean> {
        const id = this.getId(type, owner);
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state, and returns the old owner.
    @Transaction()
    public async TransferAsset(ctx: Context, type: string, owner:string, toOwner: string, value: number): Promise<string> {
        const assetFromString = await this.ReadAsset(ctx, type, owner);
        const assetToString = await this.ReadAsset(ctx, type, toOwner);

        let assetFrom = JSON.parse(assetFromString);
        assetFrom.Value = assetFrom.Value - value;
        let assetTo = JSON.parse(assetToString);
        assetTo.Value = assetTo.Value + value;

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        const fromId = this.getId(type, owner);
        await ctx.stub.putState(fromId, Buffer.from(stringify(sortKeysRecursive(assetFrom))));
        const toId = this.getId(type, toOwner);
        await ctx.stub.putState(toId, Buffer.from(stringify(sortKeysRecursive(assetTo))));

        return assetFrom;
    }

    @Transaction()
    public async TransferTo(ctx: Context, type: string, toOwner: string, value: number): Promise<string> {

        const cid = ctx.clientIdentity;
        const owner = cid.getAttributeValue('abtest.username');       
        const assetFromString = await this.ReadAsset(ctx, type, owner);
        const assetToString = await this.ReadAsset(ctx, type, toOwner);

        let assetFrom = JSON.parse(assetFromString);
        assetFrom.Value = assetFrom.Value - value;
        let assetTo = JSON.parse(assetToString);
        assetTo.Value = assetTo.Value + value;

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        const fromId = this.getId(type, owner);
        await ctx.stub.putState(fromId, Buffer.from(stringify(sortKeysRecursive(assetFrom))));
        const toId = this.getId(type, toOwner);
        await ctx.stub.putState(toId, Buffer.from(stringify(sortKeysRecursive(assetTo))));

        return assetFrom;
    }


    // GetAllAssets returns all assets found in the world state.
    @Transaction(false)
    @Returns('string')
    public async GetAllAssets(ctx: Context): Promise<string> {

        const cid = ctx.clientIdentity;
        console.log(cid);
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}
