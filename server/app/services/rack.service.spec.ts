import { Player } from '@app/classes/player/player.class';
import { expect } from 'chai';
import { RackService } from './rack.service';

describe('Rack Service', () => {
    let player: Player;
    let rackService: RackService;

    beforeEach(() => {
        player = new Player('test');
        player.rack = [
            { value: 'a', quantity: 1, points: 1 },
            { value: 'b', quantity: 1, points: 1 },
        ];
        player.score = 0;
        player.room = 'testRoom';
        rackService = new RackService();
    });

    context('areLettersInRack() tests', () => {
        it('areLettersInRack() should return true if letter is in rack', () => {
            expect(rackService.areLettersInRack(['b'], player)).to.equal(true);
        });

        it('areLettersInRack() should return false if letter is not in rack', () => {
            expect(rackService.areLettersInRack(['c'], player)).to.equal(false);
        });

        it('return a list of 1 letter if only 1 letter is in command and it is present in rack', () => {
            expect(rackService.findLettersPresentInRack(['a'], player.rack).length).to.eql(1);
        });

        it('return empty list if letters are not in the rack', () => {
            expect(rackService.findLettersPresentInRack(['c'], player.rack)).to.eql([]);
        });

        it('return empty list if not every letters match the rack', () => {
            expect(rackService.findLettersPresentInRack(['c'], player.rack)).to.eql([]);
        });

        it('should return false if letters do not match the player rack', () => {
            expect(rackService.areLettersInRack(['c', 'a'], player)).to.equal(false);
        });

        it('should return false if letters do not match the player rack', () => {
            expect(rackService.areLettersInRack(['c', '*'], player)).to.equal(false);
        });

        it('should return false if there is only one letter not matching the player rack', () => {
            expect(rackService.areLettersInRack(['a', 'c'], player)).to.equal(false);
        });

        it('should return false if player rack is empty', () => {
            player.rack = [];
            expect(rackService.areLettersInRack(['a'], player)).to.equal(false);
        });

        it('should return false if there is 2 times the same letter in letterCoords but only once in player rack', () => {
            expect(rackService.areLettersInRack(['a', 'a'], player)).to.equal(false);
        });

        it('should return true if all letters match exactly the player rack', () => {
            expect(rackService.areLettersInRack(['a', 'b'], player)).to.equal(true);
        });

        it('should return true if all the letterCoords are in the player rack but dont match exactly', () => {
            expect(rackService.areLettersInRack(['a'], player)).to.equal(true);
        });
    });

    it('updatePlayerRack() should remove * if capital letter is found in commandInfo.letters', () => {
        player.rack = [
            { value: 'a', quantity: 1, points: 1 },
            { value: '*', quantity: 1, points: 0 },
        ];
        rackService.updatePlayerRack(['a', 'L'], player.rack);
        expect(player.rack.length).to.equal(0);
    });

    it('createTempRack() should return deep copy of playerRack', () => {
        const copyRack = rackService.createTempRack(player);
        expect(copyRack).to.not.equal(player.rack);
        expect(copyRack).to.deep.equal(player.rack);
    });
});
