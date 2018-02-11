/// <reference path="../external.ts" />

/**
 * Item effect / usage description
 */
interface ItemEffect {

    /** 'combatSkill' for combat skill increment. 'endurance' for endurance points increment. */
    cls : string;

    /** Attribute increment */
    increment : number;
}

/**
 * Game object information
 */
class Item {

    // Object types
    public static readonly SPECIAL = 'special';
    public static readonly OBJECT = 'object';
    public static readonly WEAPON = 'weapon';

    // Object ids
    public static readonly MONEY = 'money';
    public static readonly QUIVER = 'quiver';
    public static readonly ARROW = 'arrow';
    public static readonly MAP = 'map';
    public static readonly BOW = 'bow';
    public static readonly MEAL = 'meal';
    
    /** The object type ('special', 'object' or 'weapon' ) */
    public type : string;

    /** The object id */
    public id : string;

    /** The translated object name */
    public name : string;

    /** True if the object is a meal */
    public isMeal : boolean;

    /** True if the object can be dropped */
    public droppable : boolean;

    /** 
     * Number of items the object it occupies on the backpack. 
     * It can be zero. It can be decimal (ex. 0.5)
     * It's used too for the Special Items max. limit
     */
    public itemCount : number;

    /** The translated object description */
    public description : string;

    /** 
     * The weapon type. Only for special and object types. It is the kind of weapon.
     * If it can be handled as more than one weapon type, separate the with a '|'.
     * Ex. 'sword|shortsword'
     */
    public weaponType : string;

    /** Get the object image URL, untranslated. null if the object has no image. */
    private imageUrl : string;

    /** 
     * The book number that contains the image (1-index based). 
     * Needed to check if the book has been downloaded on the Cordova app
     */
    private imageBookNumber : number;

    /** Effect (when the player carry the object) */
    public effect : ItemEffect;

    /** Usage (only one use, and then the object is dropped) */
    public usage : ItemEffect;

    /** Id of object that cannot be carried at same time with this object.
      * null if there are no incompatibilities
      */
    public incompatibleWith : string;

    /**
     * Game object information
     * @param book The owner book
     * @param $o The XML tag with the object info
     * @param objectId The object identifier 
     */
    constructor(book : Book, $o : any, objectId : string) {

        /** The object type ('special', 'object' or 'weapon' ) */
        this.type = $o.prop("tagName");
        /** The object id */
        this.id = objectId;
        /** The translated object name */
        this.name = $o.find('name[lang=' + book.language + ']').text();
        /** True if the object is a meal */
        this.isMeal = $o.attr('isMeal') == 'true';
        /** True if the object can be dropped */
        this.droppable = $o.attr('droppable') != 'false';

        /** Number of items the object it occupies on the backpack */
        const txtItemCount : string = $o.attr('itemCount');
        this.itemCount = txtItemCount ? parseFloat( txtItemCount ) : 1;

        /** The translated object description */
        this.description = $o.find('description[lang=' + book.language + ']').text();
        if( this.itemCount != 1 ) {
            // Add description of the size used 
            if( this.description )
                this.description += ' ';
            this.description += translations.text( 'countAsObjects' , [this.itemCount] );
        }
            

        /** 
         * The weapon type. Only for special and object types. It is the kind of weapon.
         * If it can be handled as more than one weapon type, separate the with a '|'.
         * Ex. 'sword|shortsword'
         */
        this.weaponType = $o.attr('weaponType');

        // Object image
        this.loadImageInfo( $o );

        // Usage (only one use, and then the object is dropped)
        var $usage = $o.find('usage');
        if( $usage.length > 0 ) {
            this.usage = {
                cls: $usage.attr('class'),
                increment: parseInt( $usage.attr('increment') ) 
            };
        }

        // Effect (when the player carry the object)
        var $effect = $o.find('effect');
        if( $effect.length > 0 ) {
            this.effect = {
                cls: $effect.attr('class'),
                increment: parseInt( $effect.attr('increment') ) 
            };
        }

        // Incompatibilities
        this.incompatibleWith = $o.attr('incompatibleWith');

        // If it's the map, add description from the book:
        if( objectId == 'map' ) {
            var mapSection = new Section( book , 'map', null);
            if( mapSection.exists() )
                this.description = mapSection.getTitleText();
        }

    }

    /** Returns true if the object is a weapon */
    public isWeapon() : boolean {
        if( this.weaponType )
            return true;
        return this.type == 'weapon';
    }

    /**
     * Returns true if the object is a weapon of a given type
     * @param  weaponType The weapon type to check
     * @return True if the object is a weapon of the given type
     */
    public isWeaponType(weaponType : string) : boolean {
        if( this.id == weaponType )
            return true;
        if( this.weaponType )
            return this.weaponType.split('|').contains( weaponType ); 
        return false;
    }

    /** Returns true if this is a hand-to-hand weapon (not a bow) */
    public isHandToHandWeapon() : boolean {
        if( !this.isWeapon() )
            return false;
        if( this.id == 'bow' || this.weaponType == 'bow' )
            return false;
        return true;
    }

    /**
     * Get the object image URL.
     * @return The object image URL. null if the object has no image or we are
     * running the Cordova app and the book for the image is not downloaded
     */
    public getImageUrl() : string {

        if( !this.imageUrl )
            return null;

        // Cordova app: Check if the book where is the image is downloaded
        if( !state.localBooksLibrary.isBookDownloaded( this.imageBookNumber ) )
            return null;
        
        return this.imageUrl;
    }

    /**
     * Returns the combat skill effect bonus for this object. Zero if it has no effect
     */
    public getCombatSkillEffect() : number {
        if( !this.effect )
            return 0;
        if( this.effect.cls != 'combatSkill' )
            return 0;
        return this.effect.increment;
    }

    /**
     * Get information about the book
     * @param {jQuery} $o XML node for object
     */
    private loadImageInfo( $o : any ) {
        const $image = $o.find('image');
        if( $image.length == 0 )
            return;

        this.imageBookNumber = parseInt( $image.attr('book') );
        const imageBook = new Book( this.imageBookNumber , state.book.language );
        this.imageUrl = imageBook.getIllustrationURL( $image.attr('name') );
    }
}

