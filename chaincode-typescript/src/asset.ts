import {Object, Property} from 'fabric-contract-api';

@Object()
export class Asset {
    @Property()
    public Type: string;

    @Property()
    public Owner: string;

    @Property()
    public Value: number;
}
