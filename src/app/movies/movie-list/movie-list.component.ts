import { Component, input, output, computed } from '@angular/core';
import { Movie } from '../movie.interface';

@Component({
  imports: [],
  selector: 'cw-movie-list',
  styleUrl: './movie-list.component.scss',
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent {
  movies = input.required<Movie[]>();
  sortedMovies = computed(() => {
    let moviesCopy = [...this.movies()];
    return moviesCopy.sort((a, b) => b.rating - a.rating);
  });
  movieClicked = output<Movie>();

  onMovieClicked(movie: Movie) {
    this.movieClicked.emit(movie);
  }
}
