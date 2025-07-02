import { Module } from "@nestjs/common";
import { MediaController } from "./app.controller";
import { MediaService } from "./media.service";
import { S3Service } from "@src/common/s3/s3.service";


@Module({
    imports : [S3Service],
    providers: [MediaService],
    controllers: [MediaController],
})
export class MediaModule {}