import { Controller, Delete, Post } from "@nestjs/common";


@Controller('media')
export class MediaController {
    @Post('upload')
    async upload() {
        // Logic for handling media upload
        // return { message: 'Media uploaded successfully' };
    }
    @Delete('delete')
    async delete (){
        // Logic for handling media deletion
        // return { message: 'Media deleted successfully' };
    }
}