<?php

namespace Database\Seeders;

use App\Models\Article;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('calm.articles') as $article) {
            $topicId = DB::table('article_topics')->where('name', $article['tag'])->value('id');

            Article::updateOrCreate(
                ['slug' => $article['slug']],
                [
                    'title' => $article['title'],
                    'tag' => $article['tag'],
                    'minutes' => $article['minutes'],
                    'hero_image' => $article['image'],
                    'author' => 1,
                    'body' => json_encode($article['body']),
                    'is_recommended' => true,
                    'topic_id' => $topicId,
                ],
            );
        }
    }
}
