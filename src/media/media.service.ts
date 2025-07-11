import { Injectable } from "@nestjs/common";
import { S3Service } from "@src/common/s3/s3.service";
import { PrismaService } from "@src/prisma.service";

@Injectable()
export class MediaService {
    constructor(private prisma: PrismaService, private s3Service: S3Service) { }
    async uploadMedia(file: any) {
        const url = await this.s3Service.uploadFile(file);
        return { url };
    }
    async deleteMedia(media_id: string) {
        return this.s3Service.deleteMedia(media_id);
    }
}