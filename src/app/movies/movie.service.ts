import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Movie } from './movie.interface';
import { Observable, catchError, retry, throwError } from 'rxjs';

@Service()
export class MovieService {
    private http : HttpClient = inject(HttpClient); 
    private moviesUrl = 'api/movies';  // URL to web api

    public updateMovie(movie: Movie) : Observable<void>{
        let url = `${this.moviesUrl}/${movie.id}`;
        return this.http.put<void>(url, movie).pipe(
            catchError(this.handleError)
        );
    }

    public getMovies() : Observable<Movie[]> {
        return this.http.get<Movie[]>(this.moviesUrl).pipe(
            retry(2),
            catchError(this.handleError)
        )
    }

    private handleError(error: any) : Observable<never> {
        console.error('An error occurred:', error);
        throw error;
    }
}
