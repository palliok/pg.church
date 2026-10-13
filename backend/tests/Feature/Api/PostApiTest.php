<?php

namespace Tests\Feature\Api;

use App\Enums\PostType;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PostApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-14 15:00:00');
    }

    public function test_index_lists_only_published_posts_newest_first(): void
    {
        $tag = Tag::query()->create(['name' => 'Отношения', 'color' => 'var(--c-second)', 'text_color' => '#ffffff']);

        Post::query()->create(['type' => PostType::News, 'title' => 'Старая', 'published_at' => '2026-06-01 12:00']);
        Post::query()->create(['type' => PostType::News, 'title' => 'Свежая', 'excerpt' => 'Анонс', 'body' => '<p>Текст</p>', 'published_at' => '2026-10-14 12:00'])
            ->tags()->attach($tag);
        Post::query()->create(['type' => PostType::News, 'title' => 'Черновик']);
        Post::query()->create(['type' => PostType::News, 'title' => 'Отложенная', 'published_at' => '2026-10-15 12:00']);

        $response = $this->getJson('/api/v1/posts');

        $response->assertOk()
            ->assertJsonPath('data.*.title', ['Свежая', 'Старая'])
            ->assertJsonPath('data.0.type', 'news')
            ->assertJsonPath('data.0.excerpt', 'Анонс')
            ->assertJsonPath('data.0.date', '14 октября')
            ->assertJsonPath('data.0.publishedAt', '2026-10-14T12:00:00+03:00')
            ->assertJsonPath('data.0.image', null)
            ->assertJsonPath('data.0.tags', [['label' => 'Отношения', 'color' => 'var(--c-second)', 'text' => '#ffffff']])
            ->assertJsonPath('data.1.date', '1 июня')
            ->assertJsonMissingPath('data.0.body')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_index_filters_by_type_and_paginates(): void
    {
        Post::query()->create(['type' => PostType::News, 'title' => 'Новость', 'published_at' => '2026-10-01 12:00']);
        Post::query()->create(['type' => PostType::Blog, 'title' => 'Блог 1', 'published_at' => '2026-10-02 12:00']);
        Post::query()->create(['type' => PostType::Blog, 'title' => 'Блог 2', 'published_at' => '2026-10-03 12:00']);

        $this->getJson('/api/v1/posts?type=blog')->assertJsonPath('data.*.title', ['Блог 2', 'Блог 1']);

        $this->getJson('/api/v1/posts?type=blog&per_page=1&page=2')
            ->assertJsonPath('data.*.title', ['Блог 1'])
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson('/api/v1/posts?type=video')->assertUnprocessable()->assertJsonValidationErrors('type');
        $this->getJson('/api/v1/posts?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    public function test_show_returns_body_and_image_url_for_published_post_only(): void
    {
        $published = Post::query()->create([
            'type' => PostType::Blog, 'title' => 'О прощении', 'body' => '<p>Текст</p>',
            'image' => 'posts/cover.jpg', 'published_at' => '2026-10-01 12:00',
        ]);
        $draft = Post::query()->create(['type' => PostType::Blog, 'title' => 'Черновик']);

        $this->getJson("/api/v1/posts/{$published->id}")
            ->assertOk()
            ->assertJsonPath('data.body', '<p>Текст</p>')
            ->assertJsonPath('data.image', config('app.url').'/storage/posts/cover.jpg')
            ->assertJsonPath('data.tags', []);

        $this->getJson("/api/v1/posts/{$draft->id}")->assertNotFound();
    }
}
