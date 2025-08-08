import { CooldownIndicatorComponent } from '../components/CooldownIndicatorComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class CooldownSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }

    update() {
        const indicatorEntities = this.entityManager.query([CooldownIndicatorComponent]);

        for (const entityId of indicatorEntities) {
            const indicator = this.entityManager.getComponent(entityId, CooldownIndicatorComponent);

            const target = indicator.targetEntityId;
            if (!this.entityManager.entities.has(target)) {
                this.entityManager.destroyEntity(entityId);
                continue;
            }

            const targetPlayer = this.entityManager.getComponent(target, PlayerComponent);
            
            const cooldownProgress = targetPlayer.rollCooldown / 3.0;

            const g = indicator.graphics;
            const barWidth = indicator.width;
            const barHeight = indicator.height;
            const filledWidth = barWidth * (1 - cooldownProgress);

            g.clear();

            if (cooldownProgress > 0) {
                g.rect(-barWidth / 2, -barHeight / 2, barWidth, barHeight)
                 .fill({ color: 0x333333, alpha: 0.8 });

                if (filledWidth > 0) {
                    g.rect(-barWidth / 2, -barHeight / 2, filledWidth, barHeight)
                     .fill({ color: 0xCCCCCC, alpha: 0.9 });
                }
            }
        }
    }
}