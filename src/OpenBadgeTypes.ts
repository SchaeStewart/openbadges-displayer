export interface Assertion {
    '@context': string
    id: IRI
    type: 'Assertion' | string
    recipient: IdentityObject
    badge: IRI | BadgeClass  
    verification: Verification
    issuedOn: Date
    image?: IRI | Image
    evidence?: Evidence
    narrative?: string
    expires?: Date
    revoked?: boolean
    revocationReason?: string
}

export interface BadgeClass {
    '@context': string
    id: IRI
    type: 'BadgeClass'
    name: string
    description: string
    image: IRI | Image
    criteria: IRI | Criteria
    issuer: Profile
    alignment?: Alignment | Array<Alignment>
    tags?: string | Array<string> 
}

export interface Profile {
    id: IRI
    type: 'Issuer' | 'Profile' | string | Array<string> | Array<IRI> // OOF
    name: string
    url: IRI
    telephone: string,
    description: string
    image: Image
    email: string
    // publicKey: CryptographicKey
    verification: Verification
    revocationList: Array<IRI>
}

type IRI = IRIInterface | string
export interface IRIInterface {
}

export interface CryptographicKey {

}

export interface Alignment {

}

export interface Criteria {

}

export interface IdentityObject {
    identity: IdentityHash | string
    type:  	IRI
    hashed: Boolean // Whether or not the identity value is hashed
    salt: string 
}

export interface IdentityHash {

}

export interface Image {
    type: string
    id: IRI
    caption: string
    author: string
}

type VerificationType = SignedBadge | 'HostedBadge' | 'hosted' | 'signed' | 'VerificationObject'

export interface Verification {
    type: VerificationType
    verificationProperty?: '@id' | string
    startsWith?: string
    allowedOrigins?: string | Array<string>
}

export interface SignedBadge {
    type: 'SignedBadge' | 'signed'
    creator?: CryptographicKey
}

export interface Evidence {
    type?: Evidence | Array<Evidence>
    id?: IRI
    narrative?: string
    name?: string
    genre?: string
    audience?: string
}