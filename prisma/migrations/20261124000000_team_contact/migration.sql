-- AlterTable
ALTER TABLE `TeamMember` ADD COLUMN `experience` VARCHAR(60) NULL,
    ADD COLUMN `facebookUrl` VARCHAR(512) NULL,
    ADD COLUMN `instagramUrl` VARCHAR(512) NULL,
    ADD COLUMN `phone` VARCHAR(40) NULL,
    ADD COLUMN `showContact` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `websiteUrl` VARCHAR(512) NULL,
    ADD COLUMN `whatsapp` VARCHAR(40) NULL;
