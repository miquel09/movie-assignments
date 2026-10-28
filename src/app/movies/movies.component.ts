import { Component, inject, signal } from '@angular/core';
import { MovieDetailComponent } from './movie-detail/movie-detail.component';
import { MovieListComponent } from './movie-list/movie-list.component';
import { Movie } from './movie.interface';
import { MovieService } from './movie.service';

@Component({
  imports: [MovieListComponent, MovieDetailComponent],
  selector: 'cw-movies',
  styleUrl: './movies.component.scss',
  templateUrl: './movies.component.html',
})
export class MoviesComponent {
  private movieService = inject(MovieService);
  selectedMovie = signal<Movie | undefined>(undefined);
  movies = signal<Movie[]>([]);

  ngOnInit() {
    const movies$ = this.movieService.getMovies();
    movies$.subscribe({
      next: (movies) => this.movies.set(movies),
      error: (error) => console.error(error)
    })
  }

  onMovieClicked(movie: Movie) {
    this.selectedMovie.set(movie);
  }
}
