import { Injectable } from "@nestjs/common";


@Injectable()
export class S3Service {
    // This service will handle interactions with AWS S3 for media storage
    // You can implement methods for uploading, deleting, and retrieving media files

    async uploadFile(file): Promise<string> {
        // Logic to upload file to S3
        return 'File uploaded successfully';
    }

    async deleteMedia(fileKey: string): Promise<string> {
        // Logic to delete file from S3
        return 'File deleted successfully';
    }
}